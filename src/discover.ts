import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  classifyModelFamilies,
  classifyTopics,
  CORPUS_END,
  CORPUS_SIZE,
  CORPUS_START,
  isPublishedInCorpusWindow,
  parseArxivFeed,
  selectCorpus,
  TARGET_LABS,
  toDailyPaper,
  type ArxivMetadata,
  type DailyPaper,
  type OfficialLabSeed,
} from "./corpus.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const limit = Number(args.limit ?? CORPUS_SIZE);
const verify = args.verify !== "false";
const outputPath = path.resolve(args.output ?? "corpus/papers.json");
const seedsPath = path.resolve(args.seeds ?? "corpus/official-lab-seeds.json");
const generatedAt = new Date().toISOString();

if (!Number.isInteger(limit) || limit <= 0) {
  throw new Error(`Invalid corpus limit: ${args.limit}`);
}

const seeds = JSON.parse(await readFile(seedsPath, "utf8")) as OfficialLabSeed[];
assertTargetLabCoverage(seeds);

console.error(`Fetching Hugging Face Daily Papers from ${CORPUS_START} through ${CORPUS_END}`);
const dailyPapers = await fetchDailyPapers(CORPUS_START, CORPUS_END);
console.error(`Found ${dailyPapers.length} unique papers in the discovery pool`);

const reserveSize = Math.max(25, Math.ceil(limit * 0.05));
const candidates = selectCorpus(dailyPapers, seeds, limit + reserveSize);
console.error(`Selected ${candidates.length} candidates, including ${seeds.length} official-lab seeds and a ${reserveSize}-paper verification reserve`);

const metadata = await fetchArxivMetadata(candidates.map((paper) => paper.arxivId));
const metadataById = new Map(metadata.map((paper) => [paper.arxivId, paper]));
const missing = candidates.filter((paper) => !metadataById.has(paper.arxivId));
if (missing.length) {
  throw new Error(`arXiv metadata missing for ${missing.length} papers: ${missing.slice(0, 10).map((paper) => paper.arxivId).join(", ")}`);
}

const verificationById = verify
  ? await verifyPdfs(metadata, generatedAt)
  : new Map<string, Awaited<ReturnType<typeof verifyPdf>>>();

const inWindowIds = new Set(
  metadata
    .filter((paper) => isPublishedInCorpusWindow(paper.publishedAt))
    .map((paper) => paper.arxivId),
);
const outOfWindowCandidates = candidates.filter((paper) => !inWindowIds.has(paper.arxivId));
if (outOfWindowCandidates.length) {
  console.error(`${outOfWindowCandidates.length} older Daily Papers candidates fall outside the arXiv v1 publication window and will be replaced`);
}

const validIds = new Set(
  candidates
    .filter((paper) => inWindowIds.has(paper.arxivId))
    .filter((paper) => !verify || verificationById.get(paper.arxivId)?.ok)
    .map((paper) => paper.arxivId),
);
const failedOfficialSeeds = seeds.filter((seed) => !validIds.has(seed.arxivId));
if (failedOfficialSeeds.length) {
  throw new Error(`Mandatory official-lab PDFs failed verification: ${failedOfficialSeeds.map((seed) => `${seed.lab}:${seed.arxivId}`).join(", ")}`);
}
const validCandidates = candidates.filter((paper) => validIds.has(paper.arxivId));
const selected = selectCorpus(validCandidates, seeds, limit);
console.error(`Frozen ${selected.length} papers after replacing ${candidates.length - validCandidates.length} invalid candidates`);

const papers = selected.map((selectedPaper, index) => {
  const arxiv = metadataById.get(selectedPaper.arxivId)!;
  const verification = verificationById.get(selectedPaper.arxivId) ?? null;
  return {
    rank: index + 1,
    arxivId: arxiv.arxivId,
    arxivVersion: arxiv.versionedArxivId,
    title: arxiv.title,
    authors: arxiv.authors,
    abstract: arxiv.abstract,
    publishedAt: arxiv.publishedAt,
    updatedAt: arxiv.updatedAt,
    submittedOnDailyAt: selectedPaper.submittedOnDailyAt || null,
    hfUpvotes: selectedPaper.hfUpvotes,
    hfSnapshotAt: generatedAt,
    arxivCategories: arxiv.categories,
    primaryArxivCategory: arxiv.primaryCategory,
    landingUrl: arxiv.landingUrl,
    pdfUrl: arxiv.pdfUrl,
    officialLab: selectedPaper.officialLab,
    officialLabEvidenceUrl: selectedPaper.officialEvidenceUrl,
    modelFamiliesMentioned: classifyModelFamilies(arxiv.title, arxiv.abstract),
    topicTags: classifyTopics(arxiv.title, arxiv.abstract),
    selectionReasons: selectedPaper.selectionReasons,
    pdfVerification: verification,
  };
});

const officialLabCounts = Object.fromEntries(
  TARGET_LABS.map((lab) => [lab, papers.filter((paper) => paper.officialLab === lab).length]),
);
const missingLabs = TARGET_LABS.filter((lab) => officialLabCounts[lab] === 0);
if (missingLabs.length) {
  throw new Error(`The generated corpus is missing official papers from: ${missingLabs.join(", ")}`);
}

const result = {
  generatedAt,
  methodologyVersion: 1,
  window: { start: CORPUS_START, end: CORPUS_END, dateField: "publishedAt" },
  selection: {
    description: "Every verified official public paper seeded for the five target labs, then the most-upvoted Hugging Face Daily Papers until the corpus reaches its limit.",
    limit,
    discoveryPoolSize: dailyPapers.length,
    topPaperUpvotes: papers[0]?.hfUpvotes ?? 0,
    lowestSelectedUpvotes: Math.min(...papers.map((paper) => paper.hfUpvotes)),
    officialLabSeedCount: seeds.length,
    verificationReserveSize: reserveSize,
    inaccessibleCandidateCount: candidates.filter((paper) => inWindowIds.has(paper.arxivId) && verify && !verificationById.get(paper.arxivId)?.ok).length,
    outOfWindowCandidateCount: outOfWindowCandidates.length,
    officialLabCounts,
  },
  sources: {
    popularity: "https://huggingface.co/api/daily_papers",
    metadata: "https://export.arxiv.org/api/query",
    pdfs: "https://arxiv.org/pdf/{versionedArxivId}",
  },
  papers,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(`Wrote ${papers.length} verified papers to ${outputPath}`);
console.log(`Official lab coverage: ${Object.entries(officialLabCounts).map(([lab, count]) => `${lab}=${count}`).join(", ")}`);

async function fetchDailyPapers(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endExclusive = new Date(`${end}T00:00:00Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const months = listMonths(startDate, endExclusive);
  const papers = new Map<string, DailyPaper>();

  for (const month of months) {
    for (let page = 0; page < 20; page += 1) {
      const url = new URL("https://huggingface.co/api/daily_papers");
      url.searchParams.set("month", month);
      url.searchParams.set("limit", "100");
      url.searchParams.set("p", String(page));
      const response = await fetchWithRetry(url);
      const rows = (await response.json()) as Array<Parameters<typeof toDailyPaper>[0]>;
      for (const row of rows) {
        const paper = toDailyPaper(row);
        // A paper belongs to the window by its original publication date, not
        // by the day Hugging Face later featured it. This prevents older work
        // that resurfaced in Daily Papers from leaking into the corpus.
        if (isPublishedInCorpusWindow(paper.publishedAt, start, end)) {
          papers.set(paper.arxivId, paper);
        }
      }
      if (rows.length < 100) break;
    }
  }
  return [...papers.values()];
}

async function fetchArxivMetadata(arxivIds: string[]) {
  const all: ArxivMetadata[] = [];
  const batches = chunk(arxivIds, 50);
  for (const [index, ids] of batches.entries()) {
    if (index > 0) await delay(3_100);
    console.error(`Fetching arXiv metadata batch ${index + 1}/${batches.length}`);
    const url = new URL("https://export.arxiv.org/api/query");
    url.searchParams.set("id_list", ids.join(","));
    url.searchParams.set("max_results", String(ids.length));
    const response = await fetchWithRetry(url);
    all.push(...parseArxivFeed(await response.text()));
  }
  return all;
}

async function verifyPdfs(metadata: ArxivMetadata[], checkedAt: string) {
  console.error(`Verifying ${metadata.length} version-pinned arXiv PDFs without downloading them`);
  const results = await mapConcurrent(metadata, 8, async (paper, index) => {
    if ((index + 1) % 100 === 0) console.error(`Verified ${index + 1}/${metadata.length} PDF URLs`);
    return [paper.arxivId, await verifyPdf(paper.pdfUrl, checkedAt)] as const;
  });
  const failures = results.filter(([, result]) => !result.ok);
  if (failures.length) console.error(`${failures.length} PDF candidates failed verification and will be replaced: ${failures.slice(0, 10).map(([id, result]) => `${id} (${result.status} ${result.contentType})`).join(", ")}`);
  return new Map(results);
}

async function verifyPdf(pdfUrl: string, checkedAt: string) {
  const response = await fetchWithRetry(pdfUrl, { method: "HEAD" }, true);
  const contentType = response.headers.get("content-type") ?? "";
  const etag = response.headers.get("etag")?.replace(/^"|"$/g, "") ?? null;
  return {
    ok: response.ok && contentType.toLowerCase().includes("application/pdf"),
    status: response.status,
    contentType,
    bytes: Number(response.headers.get("content-length") ?? 0) || null,
    sha256: etag?.startsWith("sha256:") ? etag.slice("sha256:".length) : null,
    checkedAt,
  };
}

async function fetchWithRetry(input: URL | string, init?: RequestInit, returnClientError = false) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(input, {
        ...init,
        headers: {
          "User-Agent": "year-in-ai-papers/0.1 (open reproducible research)",
          ...init?.headers,
        },
      });
      if (response.ok) return response;
      lastError = new Error(`${response.status} ${response.statusText} for ${input}`);
      if (response.status !== 429 && response.status < 500) {
        if (returnClientError) return response;
        throw lastError;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(1_000 * 2 ** attempt);
  }
  throw lastError;
}

function assertTargetLabCoverage(seeds: OfficialLabSeed[]) {
  const labs = new Set(seeds.map((seed) => seed.lab));
  const missing = TARGET_LABS.filter((lab) => !labs.has(lab));
  if (missing.length) {
    throw new Error(`Official seed file must cover every target lab; missing: ${missing.join(", ")}`);
  }
}

function listMonths(start: Date, endExclusive: Date) {
  const months: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor < endExclusive) {
    months.push(cursor.toISOString().slice(0, 7));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function mapConcurrent<T, U>(values: T[], concurrency: number, mapper: (value: T, index: number) => Promise<U>) {
  const output = new Array<U>(values.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor;
        cursor += 1;
        output[index] = await mapper(values[index]!, index);
      }
    }),
  );
  return output;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
