import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { classifyTopics } from "./corpus.js";
import { createPaperDatabase } from "./paper-database.js";

type JsonObject = Record<string, unknown>;

type CorePaper = {
  rank: number;
  arxivId: string;
  arxivVersion: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  updatedAt: string;
  hfUpvotes: number;
  hfSnapshotAt: string;
  arxivCategories: string[];
  landingUrl: string;
  pdfUrl: string;
  officialLab: string | null;
  officialLabEvidenceUrl: string | null;
  topicTags: string[];
};

type SupplementalPaper = {
  id: string;
  arxivId?: string;
  title: string;
  landingPage: string;
  pdfUrl: string;
  officialLab?: string | null;
  officialLabEvidenceUrl?: string | null;
};

type ProfileRecord = {
  id: string;
  pages: number;
  characters: number;
};

type SemanticRecord = {
  arxivId: string;
  paper: {
    paperId: string | null;
    title: string | null;
    authors: Array<{ name: string }> | null;
    abstract: string | null;
    externalIds: Record<string, string> | null;
    citationCount: number | null;
    venue: string | null;
    publicationDate: string | null;
  } | null;
};

type PublicationRecord = {
  collectionId: string;
  datacite: {
    status: string;
    doi: string | null;
    retrievedAt: string;
    sourceUrl: string | null;
    explicitLicense: {
      name: string | null;
      uri: string | null;
      identifier: string | null;
    } | null;
  };
  openAlex: {
    status: string;
    citationCount: number | null;
    retrievedAt: string;
    sourceUrl: string;
    openAlexId: string | null;
    venue: { name: string | null } | null;
  } | null;
};

type HfRecord = {
  collectionId: string;
  retrievedAt: string;
  projectPage: string | null;
  mappedOfficialLab: string | null;
  mappedOfficialLabEvidenceUrl: string | null;
};

export type GithubRecord = {
  collectionId: string;
  accepted: boolean;
  repositoryUrl: string | null;
  githubStars: number | null;
  githubStarsSnapshotAt: string | null;
  githubRepositoryEvidenceUrl: string | null;
  githubRepositorySource: "official-lab" | "huggingface-paper" | null;
  repositoryConfidence: "verified" | "strong" | "candidate" | "unknown";
  mappedOfficialLab: string | null;
  mappedOfficialLabEvidenceUrl: string | null;
  relationshipEvidence: Array<{ location: string; matchedBy: string }>;
  archived: boolean | null;
};

type SummaryRecord = {
  summary: string;
  model: string;
  methodologyVersion: number;
  generatedAt: string;
};

type ManualRecord = {
  collectionId: string;
  authors: string[];
  publishedAt: string;
  venue: string;
  metadataEvidenceUrl: string;
  venueEvidenceUrl: string;
  github: {
    repositoryUrl: string;
    githubStars: number;
    githubStarsSnapshotAt: string;
    githubRepositoryEvidenceUrl: string;
    repositoryConfidence: "verified";
  };
};

export function chooseRepository(records: GithubRecord[]): GithubRecord | null {
  const accepted = records.filter((record) => record.accepted && record.repositoryUrl);
  accepted.sort((left, right) => {
    const confidence = scoreConfidence(right.repositoryConfidence) - scoreConfidence(left.repositoryConfidence);
    if (confidence) return confidence;
    const active = Number(left.archived === true) - Number(right.archived === true);
    if (active) return active;
    const evidence = right.relationshipEvidence.length - left.relationshipEvidence.length;
    if (evidence) return evidence;
    const stars = (right.githubStars ?? -1) - (left.githubStars ?? -1);
    if (stars) return stars;
    return (left.repositoryUrl ?? "").localeCompare(right.repositoryUrl ?? "");
  });
  return accepted[0] ?? null;
}

export function resolveOfficialLab(args: {
  curatedLab: string | null;
  curatedEvidenceUrl: string | null;
  curatedSource: "curated-seed" | "together-research" | null;
  githubRecords: GithubRecord[];
  huggingFace: HfRecord | null;
}) {
  if (args.curatedLab && args.curatedEvidenceUrl && args.curatedSource) {
    return {
      officialLab: args.curatedLab,
      officialLabEvidenceUrl: args.curatedEvidenceUrl,
      officialLabSource: args.curatedSource,
      officialLabConfidence: "verified" as const,
    };
  }
  const repository = args.githubRecords
    .filter((record) => record.accepted && record.repositoryConfidence === "verified" && record.mappedOfficialLab)
    .sort((left, right) => (left.repositoryUrl ?? "").localeCompare(right.repositoryUrl ?? ""))[0];
  if (repository?.mappedOfficialLab) {
    return {
      officialLab: repository.mappedOfficialLab,
      officialLabEvidenceUrl: repository.mappedOfficialLabEvidenceUrl ?? repository.repositoryUrl,
      officialLabSource: "official-repository" as const,
      officialLabConfidence: "verified" as const,
    };
  }
  if (args.huggingFace?.mappedOfficialLab && args.huggingFace.mappedOfficialLabEvidenceUrl) {
    return {
      officialLab: args.huggingFace.mappedOfficialLab,
      officialLabEvidenceUrl: args.huggingFace.mappedOfficialLabEvidenceUrl,
      officialLabSource: "huggingface-organization" as const,
      officialLabConfidence: "strong" as const,
    };
  }
  return {
    officialLab: null,
    officialLabEvidenceUrl: null,
    officialLabSource: null,
    officialLabConfidence: "unknown" as const,
  };
}

export function resolveCitation(
  semantic: SemanticRecord | null,
  publication: PublicationRecord | null,
  semanticRetrievedAt: string,
) {
  if (semantic?.paper?.citationCount !== null && semantic?.paper?.citationCount !== undefined) {
    return {
      citationCount: semantic.paper.citationCount,
      citationSource: "semantic-scholar" as const,
      citationSnapshotAt: semanticRetrievedAt,
      citationSourceUrl: semantic.paper.paperId
        ? `https://www.semanticscholar.org/paper/${semantic.paper.paperId}`
        : null,
      semanticScholarPaperId: semantic.paper.paperId,
      openAlexId: null,
    };
  }
  const openAlex = publication?.openAlex;
  if (openAlex?.status === "ok" && openAlex.citationCount !== null) {
    return {
      citationCount: openAlex.citationCount,
      citationSource: "openalex" as const,
      citationSnapshotAt: openAlex.retrievedAt,
      citationSourceUrl: openAlex.sourceUrl,
      semanticScholarPaperId: null,
      openAlexId: openAlex.openAlexId,
    };
  }
  return {
    citationCount: null,
    citationSource: null,
    citationSnapshotAt: null,
    citationSourceUrl: null,
    semanticScholarPaperId: null,
    openAlexId: null,
  };
}

async function main() {
  const root = resolve(process.cwd());
  const core = await readJson<{ papers: CorePaper[] }>(resolve(root, "corpus/papers.json"));
  const supplemental = await readJson<SupplementalPaper[]>(resolve(root, "supplemental/together-research/sources.json"));
  const coreProfile = await readJson<ProfileRecord[]>(resolve(root, "corpus/full-1000-profile.json"));
  const supplementalProfile = await readJson<ProfileRecord[]>(resolve(root, "supplemental/together-research/profile.json"));
  const semanticSnapshot = await readJson<{ retrievedAt: string; records: SemanticRecord[] }>(resolve(root, "metadata/raw/semantic-scholar.json"));
  const publicationSnapshot = await readJson<{ generatedAt: string; records: PublicationRecord[] }>(resolve(root, "metadata/raw/publication.json"));
  const hfSnapshot = await readJson<{ generatedAt: string; records: HfRecord[] }>(resolve(root, "metadata/raw/hugging-face.json"));
  const githubSnapshot = await readJson<{ generatedAt: string; records: GithubRecord[] }>(resolve(root, "metadata/raw/github.json"));
  const manualSnapshot = await readJson<{ generatedAt: string; records: ManualRecord[] }>(resolve(root, "metadata/manual.json"));
  const supplementalResults = await readJson<BenchmarkResult>(resolve(root, "supplemental/together-research/run-deepseek-v11/result.json"));
  const coreSummaries = await loadCoreSummaries(resolve(root, "results/raw"));
  const supplementalSummaries = summaryMapFromResult(supplementalResults);

  const profileById = new Map([...coreProfile, ...supplementalProfile].map((record) => [record.id, record]));
  const semanticById = new Map(semanticSnapshot.records.map((record) => [record.arxivId, record]));
  const publicationById = new Map(publicationSnapshot.records.map((record) => [record.collectionId, record]));
  const hfById = new Map(hfSnapshot.records.map((record) => [record.collectionId, record]));
  const githubById = Map.groupBy(githubSnapshot.records, (record) => record.collectionId);
  const manualById = new Map(manualSnapshot.records.map((record) => [record.collectionId, record]));

  const papers = [
    ...core.papers.map((paper) => buildCoreRecord({
      paper,
      profile: profileById.get(`arxiv-${paper.arxivId}`) ?? null,
      semantic: semanticById.get(paper.arxivId) ?? null,
      publication: publicationById.get(`arxiv-${paper.arxivId}`) ?? null,
      huggingFace: hfById.get(`arxiv-${paper.arxivId}`) ?? null,
      githubRecords: githubById.get(`arxiv-${paper.arxivId}`) ?? [],
      summary: coreSummaries.get(paper.arxivId) ?? null,
      semanticRetrievedAt: semanticSnapshot.retrievedAt,
      manual: null,
    })),
    ...supplemental.map((paper) => buildSupplementalRecord({
      paper,
      profile: profileById.get(paper.id) ?? null,
      semantic: paper.arxivId ? semanticById.get(paper.arxivId) ?? null : null,
      publication: publicationById.get(paper.id) ?? null,
      huggingFace: hfById.get(paper.id) ?? null,
      githubRecords: [
        ...(githubById.get(paper.id) ?? []),
        ...manualGithubRecords(manualById.get(paper.id) ?? null),
      ],
      summary: supplementalSummaries.get(paper.id) ?? null,
      semanticRetrievedAt: semanticSnapshot.retrievedAt,
      manual: manualById.get(paper.id) ?? null,
    })),
  ];

  validateFinalDataset(papers);
  const generatedAt = new Date().toISOString();
  const output = {
    schemaVersion: 1,
    generatedAt,
    paperCount: papers.length,
    sources: {
      semanticScholarSnapshotAt: semanticSnapshot.retrievedAt,
      publicationSnapshotAt: publicationSnapshot.generatedAt,
      huggingFaceSnapshotAt: hfSnapshot.generatedAt,
      githubSnapshotAt: githubSnapshot.generatedAt,
    },
    papers,
  };
  const report = buildReport(papers, githubSnapshot.records, generatedAt);
  createPaperDatabase(output, resolve(root, "data/papers.sqlite"), { overwrite: true });
  await writeJson(resolve(root, "metadata/papers.json"), output);
  await writeJson(resolve(root, "metadata/report.json"), report);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

type CommonInputs = {
  profile: ProfileRecord | null;
  semantic: SemanticRecord | null;
  publication: PublicationRecord | null;
  huggingFace: HfRecord | null;
  githubRecords: GithubRecord[];
  summary: SummaryRecord | null;
  semanticRetrievedAt: string;
  manual: ManualRecord | null;
};

function buildCoreRecord(inputs: CommonInputs & { paper: CorePaper }) {
  const collectionId = `arxiv-${inputs.paper.arxivId}`;
  return buildRecord({
    ...inputs,
    collectionId,
    arxivId: inputs.paper.arxivId,
    arxivVersion: inputs.paper.arxivVersion,
    title: inputs.paper.title,
    authors: inputs.paper.authors,
    abstract: inputs.paper.abstract,
    publishedAt: inputs.paper.publishedAt,
    updatedAt: inputs.paper.updatedAt,
    landingUrl: inputs.paper.landingUrl,
    pdfUrl: inputs.paper.pdfUrl,
    sourceCollection: "benchmark-1000",
    benchmarkRank: inputs.paper.rank,
    topicTags: inputs.paper.topicTags,
    arxivCategories: inputs.paper.arxivCategories,
    hfUpvotes: inputs.paper.hfUpvotes,
    hfSnapshotAt: inputs.paper.hfSnapshotAt,
    curatedLab: inputs.paper.officialLab,
    curatedEvidenceUrl: inputs.paper.officialLabEvidenceUrl,
    curatedSource: inputs.paper.officialLab ? "curated-seed" : null,
  });
}

function buildSupplementalRecord(inputs: CommonInputs & { paper: SupplementalPaper }) {
  const semanticPaper = inputs.semantic?.paper;
  const abstract = semanticPaper?.abstract ?? null;
  return buildRecord({
    ...inputs,
    collectionId: inputs.paper.id,
    arxivId: inputs.paper.arxivId ?? null,
    arxivVersion: inputs.paper.arxivId ?? null,
    title: inputs.paper.title,
    authors: inputs.manual?.authors ?? semanticPaper?.authors?.map((author) => author.name) ?? [],
    abstract,
    publishedAt: inputs.manual?.publishedAt ?? (semanticPaper?.publicationDate ? `${semanticPaper.publicationDate}T00:00:00Z` : null),
    updatedAt: null,
    landingUrl: inputs.paper.landingPage,
    pdfUrl: inputs.paper.pdfUrl,
    sourceCollection: "together-research-18",
    benchmarkRank: null,
    topicTags: classifyTopics(inputs.paper.title, abstract ?? ""),
    arxivCategories: [],
    hfUpvotes: null,
    hfSnapshotAt: null,
    curatedLab: inputs.paper.officialLab ?? null,
    curatedEvidenceUrl: inputs.paper.officialLabEvidenceUrl ?? null,
    curatedSource: inputs.paper.officialLab ? "together-research" : null,
  });
}

function buildRecord(inputs: CommonInputs & {
  collectionId: string;
  arxivId: string | null;
  arxivVersion: string | null;
  title: string;
  authors: string[];
  abstract: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  landingUrl: string;
  pdfUrl: string;
  sourceCollection: "benchmark-1000" | "together-research-18";
  benchmarkRank: number | null;
  topicTags: string[];
  arxivCategories: string[];
  hfUpvotes: number | null;
  hfSnapshotAt: string | null;
  curatedLab: string | null;
  curatedEvidenceUrl: string | null;
  curatedSource: "curated-seed" | "together-research" | null;
}) {
  const repository = chooseRepository(inputs.githubRecords);
  const lab = resolveOfficialLab({
    curatedLab: inputs.curatedLab,
    curatedEvidenceUrl: inputs.curatedEvidenceUrl,
    curatedSource: inputs.curatedSource,
    githubRecords: inputs.githubRecords,
    huggingFace: inputs.huggingFace,
  });
  const citation = resolveCitation(inputs.semantic, inputs.publication, inputs.semanticRetrievedAt);
  const semanticDoi = inputs.semantic?.paper?.externalIds?.DOI ?? null;
  const arxivDoi = inputs.publication?.datacite.status === "ok" ? inputs.publication.datacite.doi : null;
  const doi = semanticDoi ?? arxivDoi;
  const semanticVenue = cleanString(inputs.semantic?.paper?.venue);
  const venue = inputs.manual?.venue ?? semanticVenue ?? inputs.publication?.openAlex?.venue?.name ?? null;
  const license = inputs.publication?.datacite.explicitLicense ?? null;
  return {
    collectionId: inputs.collectionId,
    arxivId: inputs.arxivId,
    arxivVersion: inputs.arxivVersion,
    title: inputs.title,
    authors: inputs.authors,
    abstract: inputs.abstract,
    publishedAt: inputs.publishedAt,
    updatedAt: inputs.updatedAt,
    landingUrl: inputs.landingUrl,
    pdfUrl: inputs.pdfUrl,
    sourceCollection: inputs.sourceCollection,
    benchmarkRank: inputs.benchmarkRank,
    pageCount: inputs.profile?.pages ?? null,
    extractedCharacters: inputs.profile?.characters ?? null,
    topicTags: inputs.topicTags,
    arxivCategories: inputs.arxivCategories,
    hfUpvotes: inputs.hfUpvotes,
    hfSnapshotAt: inputs.hfSnapshotAt,
    summary: inputs.summary?.summary ?? null,
    summaryModel: inputs.summary?.model ?? null,
    summaryMethodologyVersion: inputs.summary?.methodologyVersion ?? null,
    summaryGeneratedAt: inputs.summary?.generatedAt ?? null,
    ...lab,
    ...citation,
    githubRepository: repository?.repositoryUrl ?? null,
    githubStars: repository?.githubStars ?? null,
    githubStarsSnapshotAt: repository?.githubStarsSnapshotAt ?? null,
    githubRepositorySource: repository?.githubRepositorySource ?? null,
    githubRepositoryEvidenceUrl: repository?.githubRepositoryEvidenceUrl ?? null,
    githubRepositoryConfidence: repository?.repositoryConfidence ?? "unknown",
    projectPage: inputs.huggingFace?.projectPage ?? null,
    doi,
    arxivDoi,
    venue,
    license: license?.identifier ?? license?.name ?? null,
    licenseName: license?.name ?? null,
    licenseUrl: license?.uri ?? null,
    publicationMetadataSource: inputs.manual ? "reviewed-first-party" : doi || license ? "datacite-and-semantic-scholar" : venue ? "semantic-scholar-or-openalex" : null,
    publicationMetadataEvidenceUrl: inputs.manual?.metadataEvidenceUrl ?? null,
    venueEvidenceUrl: inputs.manual?.venueEvidenceUrl ?? null,
  };
}

function manualGithubRecords(manual: ManualRecord | null): GithubRecord[] {
  if (!manual) return [];
  return [{
    collectionId: manual.collectionId,
    accepted: true,
    repositoryUrl: manual.github.repositoryUrl,
    githubStars: manual.github.githubStars,
    githubStarsSnapshotAt: manual.github.githubStarsSnapshotAt,
    githubRepositoryEvidenceUrl: manual.github.githubRepositoryEvidenceUrl,
    githubRepositorySource: "official-lab",
    repositoryConfidence: manual.github.repositoryConfidence,
    mappedOfficialLab: "Together AI",
    mappedOfficialLabEvidenceUrl: manual.github.repositoryUrl,
    relationshipEvidence: [{ location: "readme", matchedBy: "landing-url" }],
    archived: false,
  }];
}

type BenchmarkResult = {
  generatedAt: string;
  methodologyVersion: number;
  rows: Array<{
    status: string;
    source: { id: string; arxivId?: string };
    model: { id: string };
    finalSummary: string | null;
  }>;
};

async function loadCoreSummaries(directory: string) {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".json"));
  const candidates = new Map<string, SummaryRecord[]>();
  for (const file of files) {
    const run = await readJson<BenchmarkResult>(resolve(directory, file));
    if (run.methodologyVersion !== 11) continue;
    for (const row of run.rows ?? []) {
      if (row.status !== "ok" || row.model.id !== "gpt-5.6-luna" || !row.finalSummary?.trim() || !row.source.arxivId) continue;
      const records = candidates.get(row.source.arxivId) ?? [];
      records.push({ summary: row.finalSummary.trim(), model: row.model.id, methodologyVersion: run.methodologyVersion, generatedAt: run.generatedAt });
      candidates.set(row.source.arxivId, records);
    }
  }
  const summaries = new Map<string, SummaryRecord>();
  for (const [arxivId, records] of candidates) {
    records.sort((left, right) => left.generatedAt.localeCompare(right.generatedAt));
    summaries.set(arxivId, records.at(-1)!);
  }
  if (summaries.size !== 1_000) throw new Error(`Expected 1,000 core summaries, found ${summaries.size}`);
  return summaries;
}

function summaryMapFromResult(result: BenchmarkResult) {
  return new Map(result.rows
    .filter((row) => row.status === "ok" && row.finalSummary?.trim())
    .map((row) => [row.source.id, {
      summary: row.finalSummary!.trim(),
      model: row.model.id,
      methodologyVersion: result.methodologyVersion,
      generatedAt: result.generatedAt,
    }]));
}

export function validateFinalDataset(papers: Array<Record<string, unknown>>) {
  if (papers.length !== 1_018) throw new Error(`Expected 1,018 papers, found ${papers.length}`);
  const collectionIds = new Set(papers.map((paper) => paper.collectionId));
  if (collectionIds.size !== 1_018) throw new Error(`Expected 1,018 unique collection IDs, found ${collectionIds.size}`);
  const arxivIds = papers.flatMap((paper) => typeof paper.arxivId === "string" ? [paper.arxivId] : []);
  if (arxivIds.length !== 1_017 || new Set(arxivIds).size !== 1_017) throw new Error("Expected 1,017 unique arXiv IDs");
  if (papers.filter((paper) => paper.arxivId === null).length !== 1) throw new Error("Expected one non-arXiv paper");
  for (const paper of papers) {
    if (paper.citationCount !== null && (!paper.citationSource || !paper.citationSnapshotAt)) {
      throw new Error(`${paper.collectionId} has a citation count without provenance`);
    }
    if (paper.githubStars !== null && (!paper.githubRepository || !paper.githubStarsSnapshotAt)) {
      throw new Error(`${paper.collectionId} has GitHub stars without repository provenance`);
    }
    if (paper.officialLab !== null && (!paper.officialLabEvidenceUrl || !paper.officialLabConfidence)) {
      throw new Error(`${paper.collectionId} has an official lab without evidence`);
    }
  }
}

function buildReport(papers: Array<Record<string, unknown>>, githubRecords: GithubRecord[], generatedAt: string) {
  const count = (field: string) => papers.filter((paper) => {
    const value = paper[field];
    return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined && value !== "";
  }).length;
  const group = (field: string) => {
    const entries: Array<[string, number]> = [...Map.groupBy(
      papers.flatMap((paper) => typeof paper[field] === "string" ? [paper[field] as string] : []),
      (value) => value,
    )].map(([key, values]) => [key, values.length]);
    entries.sort(([left], [right]) => left.localeCompare(right));
    return Object.fromEntries(entries);
  };
  return {
    generatedAt,
    paperCount: papers.length,
    arxivPaperCount: papers.filter((paper) => paper.arxivId !== null).length,
    nonArxivPaperCount: papers.filter((paper) => paper.arxivId === null).length,
    coverage: {
      title: count("title"),
      authors: count("authors"),
      abstract: count("abstract"),
      publishedAt: count("publishedAt"),
      topicTags: count("topicTags"),
      summary: count("summary"),
      officialLab: count("officialLab"),
      citationCount: count("citationCount"),
      githubRepository: count("githubRepository"),
      githubStars: count("githubStars"),
      doi: count("doi"),
      venue: count("venue"),
      license: count("license"),
    },
    officialLabs: group("officialLab"),
    officialLabSources: group("officialLabSource"),
    citationSources: group("citationSource"),
    repositoryConfidence: group("githubRepositoryConfidence"),
    unresolved: {
      citations: papers.filter((paper) => paper.citationCount === null).map((paper) => paper.collectionId),
      repositories: papers.filter((paper) => paper.githubRepository === null).length,
      officialLabs: papers.filter((paper) => paper.officialLab === null).length,
      bibliographicIdentity: papers.filter((paper) => paper.doi === null).map((paper) => paper.collectionId),
    },
    reviewQueue: githubRecords
      .filter((record) => !record.accepted && record.repositoryConfidence === "candidate")
      .map((record) => ({ collectionId: record.collectionId, repositoryUrl: record.repositoryUrl })),
  };
}

function scoreConfidence(value: GithubRecord["repositoryConfidence"]) {
  return value === "verified" ? 3 : value === "strong" ? 2 : value === "candidate" ? 1 : 0;
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}

async function writeJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const entryPoint = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (entryPoint === import.meta.url) await main();
