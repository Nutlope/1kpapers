import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const SEMANTIC_SCHOLAR_ENDPOINT =
  "https://api.semanticscholar.org/graph/v1/paper/batch";
export const SEMANTIC_SCHOLAR_FIELDS = [
  "paperId",
  "title",
  "authors",
  "abstract",
  "externalIds",
  "citationCount",
  "venue",
  "publicationVenue",
  "publicationDate",
  "openAccessPdf",
] as const;
export const MAX_BATCH_SIZE = 500;

type CoreCorpus = {
  papers: Array<{ arxivId: string }>;
};

type SupplementalSource = {
  arxivId?: string;
  landingPage?: string;
};

export type SemanticScholarPaper = {
  paperId: string | null;
  title: string | null;
  authors: Array<{ authorId: string | null; name: string }> | null;
  abstract: string | null;
  externalIds: Record<string, string> | null;
  citationCount: number | null;
  venue: string | null;
  publicationVenue: {
    id: string | null;
    name: string | null;
    type: string | null;
    alternate_names: string[] | null;
    url: string | null;
  } | null;
  publicationDate: string | null;
  openAccessPdf: {
    url: string | null;
    status: string | null;
    license: string | null;
    disclaimer: string | null;
  } | null;
};

export type SemanticScholarSnapshot = {
  retrievedAt: string;
  source: "Semantic Scholar Academic Graph API";
  endpoint: string;
  requestedFields: string[];
  identifierFormat: "ARXIV:{source identifier}";
  batchSize: number;
  recordCount: number;
  matchedCount: number;
  unmatchedCount: number;
  records: Array<{
    arxivId: string;
    paper: SemanticScholarPaper | null;
  }>;
};

type FetchOptions = {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  apiKey?: string;
  maxAttempts?: number;
  initialBackoffMs?: number;
  betweenBatchDelayMs?: number;
  now?: () => Date;
};

export function buildSourceArxivIds(
  corpus: CoreCorpus,
  supplemental: SupplementalSource[],
): string[] {
  const coreIds = corpus.papers.map((paper) => canonicalSourceId(paper.arxivId));
  const supplementalIds = supplemental.map((source) => {
    if (source.arxivId) return canonicalSourceId(source.arxivId);
    const match = source.landingPage?.match(/\/abs\/([^/?#]+)\/?(?:[?#].*)?$/);
    if (!match?.[1]) {
      throw new Error(`Supplemental source has no arXiv-compatible identifier: ${source.landingPage ?? "missing URL"}`);
    }
    return canonicalSourceId(match[1]);
  });
  const ids = [...coreIds, ...supplementalIds];
  const uniqueIds = new Set(ids);
  if (ids.length !== 1_018 || uniqueIds.size !== 1_018) {
    throw new Error(
      `Expected 1,018 unique source identifiers, found ${ids.length} records and ${uniqueIds.size} unique identifiers`,
    );
  }
  return ids;
}

export function splitIntoBatches<T>(values: T[], batchSize = MAX_BATCH_SIZE): T[][] {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > MAX_BATCH_SIZE) {
    throw new Error(`Batch size must be an integer from 1 to ${MAX_BATCH_SIZE}`);
  }
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += batchSize) {
    batches.push(values.slice(index, index + batchSize));
  }
  return batches;
}

export async function fetchSemanticScholarSnapshot(
  arxivIds: string[],
  options: FetchOptions = {},
): Promise<SemanticScholarSnapshot> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const maxAttempts = options.maxAttempts ?? 8;
  const initialBackoffMs = options.initialBackoffMs ?? 5_000;
  const betweenBatchDelayMs = options.betweenBatchDelayMs ?? 1_100;
  const now = options.now ?? (() => new Date());
  const batches = splitIntoBatches(arxivIds);
  const papers: Array<SemanticScholarPaper | null> = [];

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index]!;
    const result = await fetchBatchWithRetry(batch, {
      fetchImpl,
      sleep,
      maxAttempts,
      initialBackoffMs,
      ...(options.apiKey ? { apiKey: options.apiKey } : {}),
    });
    papers.push(...result);
    if (index < batches.length - 1 && betweenBatchDelayMs > 0) {
      await sleep(betweenBatchDelayMs);
    }
  }

  if (papers.length !== arxivIds.length) {
    throw new Error(`Semantic Scholar returned ${papers.length} rows for ${arxivIds.length} identifiers`);
  }

  const records = arxivIds.map((arxivId, index) => ({
    arxivId,
    paper: papers[index] ?? null,
  }));
  const matchedCount = records.filter((record) => record.paper !== null).length;
  return {
    retrievedAt: now().toISOString(),
    source: "Semantic Scholar Academic Graph API",
    endpoint: SEMANTIC_SCHOLAR_ENDPOINT,
    requestedFields: [...SEMANTIC_SCHOLAR_FIELDS],
    identifierFormat: "ARXIV:{source identifier}",
    batchSize: MAX_BATCH_SIZE,
    recordCount: records.length,
    matchedCount,
    unmatchedCount: records.length - matchedCount,
    records,
  };
}

async function fetchBatchWithRetry(
  arxivIds: string[],
  options: Required<Pick<FetchOptions, "fetchImpl" | "sleep" | "maxAttempts" | "initialBackoffMs">> & {
    apiKey?: string;
  },
): Promise<Array<SemanticScholarPaper | null>> {
  const url = new URL(SEMANTIC_SCHOLAR_ENDPOINT);
  url.searchParams.set("fields", SEMANTIC_SCHOLAR_FIELDS.join(","));
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options.apiKey) headers["x-api-key"] = options.apiKey;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await options.fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ ids: arxivIds.map((id) => `ARXIV:${id}`) }),
      });
    } catch (error) {
      if (attempt === options.maxAttempts) throw error;
      await options.sleep(options.initialBackoffMs * 2 ** (attempt - 1));
      continue;
    }

    if (response.ok) {
      const payload: unknown = await response.json();
      if (!Array.isArray(payload) || payload.length !== arxivIds.length) {
        throw new Error(
          `Semantic Scholar returned an invalid batch length for ${arxivIds.length} identifiers`,
        );
      }
      return payload.map((paper) => normalizePaper(paper));
    }

    const errorBody = await response.text();
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === options.maxAttempts) {
      throw new Error(
        `Semantic Scholar request failed with ${response.status}: ${errorBody.slice(0, 500)}`,
      );
    }
    const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"), Date.now());
    await options.sleep(
      retryAfterMs ?? options.initialBackoffMs * 2 ** (attempt - 1),
    );
  }
  throw new Error("Semantic Scholar retry loop ended unexpectedly");
}

function normalizePaper(value: unknown): SemanticScholarPaper | null {
  if (value === null) return null;
  if (!value || typeof value !== "object") {
    throw new Error("Semantic Scholar returned a non-object paper record");
  }
  return value as SemanticScholarPaper;
}

function canonicalSourceId(value: string) {
  return value.trim().replace(/^ARXIV:/i, "").replace(/v\d+$/, "");
}

function parseRetryAfter(value: string | null, nowMs: number) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) return null;
  return Math.max(0, dateMs - nowMs);
}

function defaultSleep(milliseconds: number) {
  return new Promise<void>((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function main() {
  const root = resolve(process.cwd());
  const corpusPath = resolve(root, "corpus/papers.json");
  const supplementalPath = resolve(root, "supplemental/together-research/sources.json");
  const outputPath = resolve(root, "metadata/raw/semantic-scholar.json");
  const corpus = JSON.parse(await readFile(corpusPath, "utf8")) as CoreCorpus;
  const supplemental = JSON.parse(
    await readFile(supplementalPath, "utf8"),
  ) as SupplementalSource[];
  const ids = buildSourceArxivIds(corpus, supplemental);
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  const snapshot = await fetchSemanticScholarSnapshot(
    ids,
    apiKey ? { apiKey } : {},
  );
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  process.stdout.write(
    `Wrote ${snapshot.recordCount} records to ${outputPath}: ${snapshot.matchedCount} matched, ${snapshot.unmatchedCount} unmatched\n`,
  );
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (entryPoint === import.meta.url) {
  await main();
}
