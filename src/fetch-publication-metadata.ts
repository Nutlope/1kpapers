import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const DATACITE_ENDPOINT = "https://api.datacite.org/dois";
export const OPENALEX_ENDPOINT = "https://api.openalex.org/works";
export const OPENALEX_FALLBACK_IDS = [
  "2510.04871",
  "2602.02084",
  "2511.13720",
] as const;
export const DEFAULT_CONCURRENCY = 6;
export const DEFAULT_MAX_ATTEMPTS = 8;

type CoreCorpus = {
  papers: Array<{
    arxivId: string;
    title: string;
  }>;
};

type SupplementalSource = {
  id: string;
  arxivId?: string;
  title: string;
};

export type CollectionPaper = {
  collectionId: string;
  arxivId: string | null;
  title: string;
};

type DataCiteAttributes = {
  doi?: string;
  titles?: Array<{ title?: string; titleType?: string; lang?: string }>;
  publisher?: string | null;
  publicationYear?: number | null;
  container?: Record<string, unknown> | null;
  types?: Record<string, string | null> | null;
  rightsList?: Array<{
    rights?: string;
    rightsUri?: string;
    rightsIdentifier?: string;
    rightsIdentifierScheme?: string;
    schemeUri?: string;
    lang?: string;
  }>;
};

type DataCitePayload = {
  data?: {
    id?: string;
    type?: string;
    attributes?: DataCiteAttributes;
  };
};

type OpenAlexWork = {
  id?: string;
  doi?: string | null;
  title?: string | null;
  cited_by_count?: number | null;
  publication_date?: string | null;
  primary_location?: {
    source?: {
      id?: string | null;
      display_name?: string | null;
      issn_l?: string | null;
      type?: string | null;
    } | null;
    license?: string | null;
    landing_page_url?: string | null;
    pdf_url?: string | null;
  } | null;
};

export type DataCiteRecord = {
  status: "ok" | "not-found" | "title-mismatch" | "error" | "not-applicable";
  requestedDoi: string | null;
  sourceUrl: string | null;
  retrievedAt: string;
  matchedBy: "exact-doi-and-normalized-title" | null;
  sourceTitle: string | null;
  normalizedCollectionTitle: string;
  normalizedSourceTitle: string | null;
  doi: string | null;
  publisher: string | null;
  publicationYear: number | null;
  resourceType: string | null;
  container: Record<string, unknown> | null;
  rightsList: NonNullable<DataCiteAttributes["rightsList"]>;
  explicitLicense: {
    name: string | null;
    uri: string | null;
    identifier: string | null;
    identifierScheme: string | null;
    schemeUri: string | null;
  } | null;
  error: string | null;
};

export type OpenAlexRecord = {
  status: "ok" | "not-found" | "title-mismatch" | "error";
  requestedDoi: string;
  sourceUrl: string;
  retrievedAt: string;
  matchedBy: "exact-doi-and-normalized-title" | null;
  sourceTitle: string | null;
  normalizedCollectionTitle: string;
  normalizedSourceTitle: string | null;
  openAlexId: string | null;
  doi: string | null;
  citationCount: number | null;
  venue: {
    id: string | null;
    name: string | null;
    issnL: string | null;
    type: string | null;
  } | null;
  license: string | null;
  publicationDate: string | null;
  landingPageUrl: string | null;
  pdfUrl: string | null;
  error: string | null;
};

export type PublicationRecord = CollectionPaper & {
  datacite: DataCiteRecord;
  openAlex: OpenAlexRecord | null;
};

export type PublicationSnapshot = {
  status: "in-progress" | "complete";
  generatedAt: string;
  collectionSize: number;
  arxivRecordCount: number;
  nonArxivRecordCount: number;
  sources: {
    datacite: {
      endpointTemplate: string;
      matchingRule: "Exact deterministic arXiv DOI and exact normalized title";
      requestedCount: number;
      matchedCount: number;
      notFoundCount: number;
      titleMismatchCount: number;
      errorCount: number;
    };
    openAlex: {
      endpointTemplate: string;
      purpose: "Citation fallback for exact Semantic Scholar misses";
      requestedArxivIds: string[];
      matchedCount: number;
      notFoundCount: number;
      titleMismatchCount: number;
      errorCount: number;
    };
  };
  records: PublicationRecord[];
};

type FetchOptions = {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => Date;
  contactEmail?: string;
  maxAttempts?: number;
  initialBackoffMs?: number;
};

type RunOptions = FetchOptions & {
  concurrency?: number;
  existingRecords?: PublicationRecord[];
  onProgress?: (records: PublicationRecord[]) => Promise<void>;
};

class SharedBackoff {
  private blockedUntil = 0;

  constructor(
    private readonly sleep: (milliseconds: number) => Promise<void>,
    private readonly nowMs: () => number = Date.now,
  ) {}

  blockFor(milliseconds: number) {
    this.blockedUntil = Math.max(this.blockedUntil, this.nowMs() + milliseconds);
  }

  async wait() {
    const remaining = this.blockedUntil - this.nowMs();
    if (remaining > 0) await this.sleep(remaining);
  }
}

export function buildPublicationCollection(
  corpus: CoreCorpus,
  supplemental: SupplementalSource[],
): CollectionPaper[] {
  const records = [
    ...corpus.papers.map((paper) => {
      const arxivId = canonicalArxivId(paper.arxivId);
      return {
        collectionId: `arxiv-${arxivId}`,
        arxivId,
        title: paper.title,
      };
    }),
    ...supplemental.map((paper) => ({
      collectionId: paper.id,
      arxivId: paper.arxivId ? canonicalArxivId(paper.arxivId) : null,
      title: paper.title,
    })),
  ];

  const collectionIds = new Set(records.map((record) => record.collectionId));
  const arxivIds = records.flatMap((record) => record.arxivId ? [record.arxivId] : []);
  if (records.length !== 1_018 || collectionIds.size !== 1_018) {
    throw new Error(
      `Expected 1,018 unique records, found ${records.length} records and ${collectionIds.size} unique collection IDs`,
    );
  }
  if (arxivIds.length !== 1_017 || new Set(arxivIds).size !== 1_017) {
    throw new Error(
      `Expected 1,017 unique canonical arXiv IDs, found ${arxivIds.length} records and ${new Set(arxivIds).size} unique IDs`,
    );
  }
  const nonArxiv = records.filter((record) => record.arxivId === null);
  if (
    nonArxiv.length !== 1 ||
    nonArxiv[0]?.collectionId !== "openreview-parallel-kernel-bench"
  ) {
    throw new Error("Expected ParallelKernelBench to be the one explicit non-arXiv record");
  }
  return records;
}

export function normalizeTitle(value: string) {
  return decodeBasicEntities(value)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/\\(?:text|mathrm|mathbf|mathit|operatorname)\s*/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(?<=\p{L})\s+(?=\p{N})|(?<=\p{N})\s+(?=\p{L})/gu, "");
}

export async function fetchPublicationRecords(
  collection: CollectionPaper[],
  options: RunOptions = {},
): Promise<PublicationRecord[]> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 20) {
    throw new Error("Concurrency must be an integer from 1 to 20");
  }
  const sleep = options.sleep ?? defaultSleep;
  const backoff = new SharedBackoff(sleep);
  const existing = new Map(
    (options.existingRecords ?? [])
      .filter(recordCanResume)
      .map((record) => [record.collectionId, record]),
  );
  const results = new Array<PublicationRecord | undefined>(collection.length);
  let cursor = 0;
  let completedSinceSave = 0;
  let progressChain = Promise.resolve();

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      const paper = collection[index];
      if (!paper) return;

      const cached = existing.get(paper.collectionId);
      let datacite: DataCiteRecord;
      if (cached && recordMatchesPaper(cached, paper)) {
        datacite = cached.datacite;
      } else if (!paper.arxivId) {
        datacite = emptyDataCiteRecord(paper, "not-applicable", options.now);
      } else {
        datacite = await fetchDataCite({ ...paper, arxivId: paper.arxivId }, backoff, options);
      }
      results[index] = { ...paper, datacite, openAlex: null };
      completedSinceSave += 1;
      if (options.onProgress && completedSinceSave >= 25) {
        completedSinceSave = 0;
        const partialRecords = results.filter(isDefined);
        progressChain = progressChain.then(() => options.onProgress!(partialRecords));
        await progressChain;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  const complete = results.filter(isDefined);

  for (const arxivId of OPENALEX_FALLBACK_IDS) {
    const record = complete.find((candidate) => candidate.arxivId === arxivId);
    if (!record) continue;
    const cached = existing.get(record.collectionId)?.openAlex;
    record.openAlex = cached && cached.status !== "error"
      ? cached
      : await fetchOpenAlex({ ...record, arxivId }, backoff, options);
  }
  await progressChain;
  if (options.onProgress) await options.onProgress(complete);
  return complete;
}

export function buildPublicationSnapshot(
  records: PublicationRecord[],
  status: PublicationSnapshot["status"],
  now: () => Date = () => new Date(),
): PublicationSnapshot {
  const dataciteRecords = records.map((record) => record.datacite);
  const openAlexRecords = records.flatMap((record) => record.openAlex ? [record.openAlex] : []);
  return {
    status,
    generatedAt: now().toISOString(),
    collectionSize: records.length,
    arxivRecordCount: records.filter((record) => record.arxivId !== null).length,
    nonArxivRecordCount: records.filter((record) => record.arxivId === null).length,
    sources: {
      datacite: {
        endpointTemplate: `${DATACITE_ENDPOINT}/10.48550/arxiv.{arxivId}`,
        matchingRule: "Exact deterministic arXiv DOI and exact normalized title",
        requestedCount: dataciteRecords.filter((record) => record.requestedDoi !== null).length,
        matchedCount: countStatus(dataciteRecords, "ok"),
        notFoundCount: countStatus(dataciteRecords, "not-found"),
        titleMismatchCount: countStatus(dataciteRecords, "title-mismatch"),
        errorCount: countStatus(dataciteRecords, "error"),
      },
      openAlex: {
        endpointTemplate: `${OPENALEX_ENDPOINT}/https://doi.org/{doi}`,
        purpose: "Citation fallback for exact Semantic Scholar misses",
        requestedArxivIds: [...OPENALEX_FALLBACK_IDS],
        matchedCount: countStatus(openAlexRecords, "ok"),
        notFoundCount: countStatus(openAlexRecords, "not-found"),
        titleMismatchCount: countStatus(openAlexRecords, "title-mismatch"),
        errorCount: countStatus(openAlexRecords, "error"),
      },
    },
    records,
  };
}

async function fetchDataCite(
  paper: CollectionPaper & { arxivId: string },
  backoff: SharedBackoff,
  options: FetchOptions,
): Promise<DataCiteRecord> {
  const requestedDoi = `10.48550/arxiv.${paper.arxivId}`;
  const sourceUrl = `${DATACITE_ENDPOINT}/${requestedDoi}`;
  const result = await fetchJsonWithRetry<DataCitePayload>(sourceUrl, backoff, options);
  const retrievedAt = getNow(options).toISOString();
  if (result.status === 404) {
    return emptyDataCiteRecord(paper, "not-found", options.now, requestedDoi, sourceUrl);
  }
  if (!result.ok) {
    return {
      ...emptyDataCiteRecord(paper, "error", options.now, requestedDoi, sourceUrl),
      retrievedAt,
      error: result.error,
    };
  }

  const attributes = result.payload.data?.attributes;
  const sourceTitle = attributes?.titles?.find((title) => !title.titleType)?.title
    ?? attributes?.titles?.[0]?.title
    ?? null;
  const normalizedCollectionTitle = normalizeTitle(paper.title);
  const normalizedSourceTitle = sourceTitle ? normalizeTitle(sourceTitle) : null;
  if (!sourceTitle || normalizedSourceTitle !== normalizedCollectionTitle) {
    return {
      ...emptyDataCiteRecord(paper, "title-mismatch", options.now, requestedDoi, sourceUrl),
      retrievedAt,
      sourceTitle,
      normalizedSourceTitle,
      doi: normalizeDoi(result.payload.data?.id ?? attributes?.doi ?? requestedDoi),
      error: sourceTitle ? "Normalized source title does not match collection title" : "Source title is missing",
    };
  }

  const rightsList = (attributes?.rightsList ?? []).map((right) => ({ ...right }));
  const firstRight = rightsList[0];
  return {
    status: "ok",
    requestedDoi,
    sourceUrl,
    retrievedAt,
    matchedBy: "exact-doi-and-normalized-title",
    sourceTitle,
    normalizedCollectionTitle,
    normalizedSourceTitle,
    doi: normalizeDoi(result.payload.data?.id ?? attributes?.doi ?? requestedDoi),
    publisher: attributes?.publisher ?? null,
    publicationYear: attributes?.publicationYear ?? null,
    resourceType: attributes?.types?.resourceType ?? attributes?.types?.resourceTypeGeneral ?? null,
    container: attributes?.container ?? null,
    rightsList,
    explicitLicense: firstRight ? {
      name: firstRight.rights ?? null,
      uri: firstRight.rightsUri ?? null,
      identifier: firstRight.rightsIdentifier ?? null,
      identifierScheme: firstRight.rightsIdentifierScheme ?? null,
      schemeUri: firstRight.schemeUri ?? null,
    } : null,
    error: null,
  };
}

async function fetchOpenAlex(
  paper: PublicationRecord & { arxivId: string },
  backoff: SharedBackoff,
  options: FetchOptions,
): Promise<OpenAlexRecord> {
  const requestedDoi = `10.48550/arxiv.${paper.arxivId}`;
  const sourceUrl = `${OPENALEX_ENDPOINT}/${encodeURIComponent(`https://doi.org/${requestedDoi}`)}`;
  const result = await fetchJsonWithRetry<OpenAlexWork>(sourceUrl, backoff, options);
  const retrievedAt = getNow(options).toISOString();
  const base: OpenAlexRecord = {
    status: "error",
    requestedDoi,
    sourceUrl,
    retrievedAt,
    matchedBy: null,
    sourceTitle: null,
    normalizedCollectionTitle: normalizeTitle(paper.title),
    normalizedSourceTitle: null,
    openAlexId: null,
    doi: null,
    citationCount: null,
    venue: null,
    license: null,
    publicationDate: null,
    landingPageUrl: null,
    pdfUrl: null,
    error: null,
  };
  if (result.status === 404) return { ...base, status: "not-found" };
  if (!result.ok) return { ...base, error: result.error };

  const work = result.payload;
  const sourceTitle = work.title ?? null;
  const normalizedSourceTitle = sourceTitle ? normalizeTitle(sourceTitle) : null;
  if (!sourceTitle || normalizedSourceTitle !== base.normalizedCollectionTitle) {
    return {
      ...base,
      status: "title-mismatch",
      sourceTitle,
      normalizedSourceTitle,
      openAlexId: work.id ?? null,
      doi: normalizeDoi(work.doi ?? requestedDoi),
      error: sourceTitle ? "Normalized source title does not match collection title" : "Source title is missing",
    };
  }

  const source = work.primary_location?.source;
  return {
    ...base,
    status: "ok",
    matchedBy: "exact-doi-and-normalized-title",
    sourceTitle,
    normalizedSourceTitle,
    openAlexId: work.id ?? null,
    doi: normalizeDoi(work.doi ?? requestedDoi),
    citationCount: typeof work.cited_by_count === "number" ? work.cited_by_count : null,
    venue: source ? {
      id: source.id ?? null,
      name: source.display_name ?? null,
      issnL: source.issn_l ?? null,
      type: source.type ?? null,
    } : null,
    license: work.primary_location?.license ?? null,
    publicationDate: work.publication_date ?? null,
    landingPageUrl: work.primary_location?.landing_page_url ?? null,
    pdfUrl: work.primary_location?.pdf_url ?? null,
    error: null,
  };
}

async function fetchJsonWithRetry<T>(
  url: string,
  backoff: SharedBackoff,
  options: FetchOptions,
): Promise<
  | { ok: true; status: number; payload: T }
  | { ok: false; status: number | null; error: string }
> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const initialBackoffMs = options.initialBackoffMs ?? 5_000;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    await backoff.wait();
    let response: Response;
    try {
      response = await fetchImpl(url, { headers: requestHeaders(options.contactEmail) });
    } catch (error) {
      if (attempt === maxAttempts) {
        return { ok: false, status: null, error: errorMessage(error) };
      }
      await sleep(initialBackoffMs * 2 ** (attempt - 1));
      continue;
    }

    if (response.ok) {
      try {
        return { ok: true, status: response.status, payload: await response.json() as T };
      } catch (error) {
        return { ok: false, status: response.status, error: `Invalid JSON: ${errorMessage(error)}` };
      }
    }
    if (response.status === 404) {
      return { ok: false, status: response.status, error: "Not found" };
    }

    const retryable = response.status === 429 || response.status >= 500;
    const body = await response.text();
    if (!retryable || attempt === maxAttempts) {
      return {
        ok: false,
        status: response.status,
        error: `HTTP ${response.status}: ${body.slice(0, 500)}`,
      };
    }

    const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"), Date.now());
    const delayMs = retryAfterMs ?? initialBackoffMs * 2 ** (attempt - 1);
    if (response.status === 429) backoff.blockFor(delayMs);
    await sleep(delayMs);
  }
  return { ok: false, status: null, error: "Retry loop ended unexpectedly" };
}

function emptyDataCiteRecord(
  paper: CollectionPaper,
  status: DataCiteRecord["status"],
  now: FetchOptions["now"],
  requestedDoi: string | null = null,
  sourceUrl: string | null = null,
): DataCiteRecord {
  return {
    status,
    requestedDoi,
    sourceUrl,
    retrievedAt: (now?.() ?? new Date()).toISOString(),
    matchedBy: null,
    sourceTitle: null,
    normalizedCollectionTitle: normalizeTitle(paper.title),
    normalizedSourceTitle: null,
    doi: null,
    publisher: null,
    publicationYear: null,
    resourceType: null,
    container: null,
    rightsList: [],
    explicitLicense: null,
    error: null,
  };
}

function requestHeaders(contactEmail?: string): Record<string, string> {
  const contact = contactEmail?.trim();
  const agent = contact
    ? `year-in-ai-papers/0.1 (mailto:${contact}; +https://github.com/riccardogiorato/year-in-ai-papers)`
    : "year-in-ai-papers/0.1 (+https://github.com/riccardogiorato/year-in-ai-papers)";
  return {
    accept: "application/json",
    "user-agent": agent,
  };
}

function recordCanResume(record: PublicationRecord) {
  return record.datacite.status === "ok"
    || record.datacite.status === "not-found"
    || record.datacite.status === "not-applicable";
}

function recordMatchesPaper(record: PublicationRecord, paper: CollectionPaper) {
  return record.collectionId === paper.collectionId
    && record.arxivId === paper.arxivId
    && normalizeTitle(record.title) === normalizeTitle(paper.title);
}

function countStatus<T extends { status: string }>(records: T[], status: T["status"]) {
  return records.filter((record) => record.status === status).length;
}

function canonicalArxivId(value: string) {
  const normalized = value.trim().replace(/^ARXIV:/i, "").replace(/v\d+$/i, "");
  if (!/^\d{4}\.\d{4,5}$/.test(normalized)) {
    throw new Error(`Invalid numeric arXiv ID: ${value}`);
  }
  return normalized;
}

function decodeBasicEntities(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#(?:39|x27);/gi, "'");
}

function normalizeDoi(value: string | null | undefined) {
  if (!value) return null;
  return value.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").toLocaleLowerCase("en-US");
}

function parseRetryAfter(value: string | null, nowMs: number) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;
  const dateMs = Date.parse(value);
  if (Number.isNaN(dateMs)) return null;
  return Math.max(0, dateMs - nowMs);
}

function getNow(options: FetchOptions) {
  return options.now?.() ?? new Date();
}

function defaultSleep(milliseconds: number) {
  return new Promise<void>((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

async function readExistingRecords(outputPath: string): Promise<PublicationRecord[]> {
  try {
    const snapshot = JSON.parse(await readFile(outputPath, "utf8")) as Partial<PublicationSnapshot>;
    return Array.isArray(snapshot.records) ? snapshot.records : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeSnapshot(outputPath: string, snapshot: PublicationSnapshot) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

async function main() {
  const root = resolve(process.cwd());
  const outputPath = resolve(root, "metadata/raw/publication.json");
  const corpus = JSON.parse(
    await readFile(resolve(root, "corpus/papers.json"), "utf8"),
  ) as CoreCorpus;
  const supplemental = JSON.parse(
    await readFile(resolve(root, "supplemental/together-research/sources.json"), "utf8"),
  ) as SupplementalSource[];
  const collection = buildPublicationCollection(corpus, supplemental);
  const existingRecords = await readExistingRecords(outputPath);
  const contactEmail = process.env.METADATA_CONTACT_EMAIL;
  const records = await fetchPublicationRecords(collection, {
    existingRecords,
    ...(contactEmail ? { contactEmail } : {}),
    onProgress: async (partialRecords) => {
      await writeSnapshot(outputPath, buildPublicationSnapshot(partialRecords, "in-progress"));
      process.stdout.write(`Publication metadata progress: ${partialRecords.length}/${collection.length}\n`);
    },
  });
  const snapshot = buildPublicationSnapshot(records, "complete");
  await writeSnapshot(outputPath, snapshot);
  process.stdout.write(`${JSON.stringify(snapshot.sources, null, 2)}\n`);
  process.stdout.write(`Wrote ${snapshot.collectionSize} records to ${outputPath}\n`);
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (entryPoint === import.meta.url) {
  await main();
}
