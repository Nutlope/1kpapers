import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const HF_OUTPUT = new URL("../metadata/raw/hugging-face.json", import.meta.url);
const GITHUB_OUTPUT = new URL("../metadata/raw/github.json", import.meta.url);
const HF_ENDPOINT = "https://huggingface.co/api/papers";
const HF_CONCURRENCY = 8;
const GITHUB_CONCURRENCY = 4;
const MAX_ATTEMPTS = 7;
const REFRESH = process.argv.includes("--refresh");

type LabName =
  | "OpenAI"
  | "Anthropic"
  | "Google DeepMind / Google"
  | "Meta AI / FAIR"
  | "DeepSeek"
  | "Alibaba / Qwen"
  | "Moonshot AI / Kimi"
  | "MiniMax"
  | "Z.ai / Zhipu / GLM"
  | "Mistral AI"
  | "xAI"
  | "NVIDIA"
  | "Together AI";

type CollectionPaper = {
  collectionId: string;
  arxivId: string | null;
  title: string;
  landingUrl: string;
  officialLab: string | null;
  officialLabEvidenceUrl: string | null;
  officialLabSource: "curated-seed" | "together-research" | null;
};

type HfOrganization = {
  name?: string;
  fullname?: string;
};

type HfResponse = {
  id?: string;
  organization?: HfOrganization;
  projectPage?: string;
  githubRepo?: string;
  githubRepoAddedBy?: string;
  githubStars?: number;
};

type HfRecord = {
  collectionId: string;
  arxivId: string | null;
  status: "ok" | "not-found" | "unavailable-without-arxiv-id" | "error";
  retrievedAt: string;
  organization: { name: string | null; fullname: string | null } | null;
  projectPage: string | null;
  githubRepo: string | null;
  githubRepoAddedBy: string | null;
  githubStars: number | null;
  mappedOfficialLab: LabName | null;
  mappedOfficialLabEvidenceUrl: string | null;
  error: string | null;
};

type DiscoverySource = "huggingface-paper" | "curated-seed" | "together-research";

type GithubCandidate = {
  paper: CollectionPaper;
  repository: string;
  discoveredFrom: DiscoverySource[];
  discoveryEvidenceUrls: string[];
};

type GithubRecord = Awaited<ReturnType<typeof validateGithubCandidate>>;

type GhRepository = {
  html_url: string;
  full_name: string;
  owner: { login: string };
  name: string;
  private: boolean;
  archived: boolean;
  stargazers_count: number;
  description: string | null;
  homepage: string | null;
  default_branch: string;
};

const ORGANIZATION_TO_LAB = new Map<string, LabName>([
  ["openai", "OpenAI"],
  ["anthropic", "Anthropic"],
  ["anthropics", "Anthropic"],
  ["google", "Google DeepMind / Google"],
  ["google-deepmind", "Google DeepMind / Google"],
  ["google-research", "Google DeepMind / Google"],
  ["deepmind", "Google DeepMind / Google"],
  ["facebook", "Meta AI / FAIR"],
  ["facebookresearch", "Meta AI / FAIR"],
  ["meta-ai", "Meta AI / FAIR"],
  ["meta-llama", "Meta AI / FAIR"],
  ["deepseek-ai", "DeepSeek"],
  ["qwen", "Alibaba / Qwen"],
  ["qwenlm", "Alibaba / Qwen"],
  ["alibaba", "Alibaba / Qwen"],
  ["alibaba-nlp", "Alibaba / Qwen"],
  ["modelscope", "Alibaba / Qwen"],
  ["moonshotai", "Moonshot AI / Kimi"],
  ["minimaxai", "MiniMax"],
  ["minimax-ai", "MiniMax"],
  ["zai-org", "Z.ai / Zhipu / GLM"],
  ["thudm", "Z.ai / Zhipu / GLM"],
  ["zhipuai", "Z.ai / Zhipu / GLM"],
  ["mistralai", "Mistral AI"],
  ["xai-org", "xAI"],
  ["nvidia", "NVIDIA"],
  ["nvidia-ai-iot", "NVIDIA"],
  ["nv-tlabs", "NVIDIA"],
  ["togethercomputer", "Together AI"],
]);

export function normalizeGithubRepository(value: string): string | null {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    if (url.hostname.toLowerCase() !== "github.com") return null;
    const [owner, repository] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repository) return null;
    const normalizedRepository = repository.replace(/\.git$/i, "");
    if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(normalizedRepository)) {
      return null;
    }
    return `${owner}/${normalizedRepository}`;
  } catch {
    return null;
  }
}

export function findPaperEvidence(
  paper: Pick<CollectionPaper, "arxivId" | "title" | "landingUrl">,
  repository: Pick<GhRepository, "description" | "homepage">,
  readme: string,
) {
  const fields = [
    ["description", repository.description ?? ""],
    ["homepage", repository.homepage ?? ""],
    ["readme", readme],
  ] as const;
  const matches: Array<{ location: string; matchedBy: "arxiv-id" | "landing-url" | "exact-title" }> = [];
  const canonicalTitle = normalizeForMatch(paper.title);
  for (const [location, value] of fields) {
    const normalizedValue = normalizeForMatch(value);
    if (paper.arxivId && containsToken(value, paper.arxivId)) {
      matches.push({ location, matchedBy: "arxiv-id" });
    }
    if (urlEvidenceMatches(value, paper.landingUrl, paper.arxivId)) {
      matches.push({ location, matchedBy: "landing-url" });
    }
    if (canonicalTitle.length >= 20 && normalizedValue.includes(canonicalTitle)) {
      matches.push({ location, matchedBy: "exact-title" });
    }
  }
  return matches;
}

export function classifyRepository(args: {
  owner: string;
  hasRelationshipEvidence: boolean;
  hasCuratedRepositoryEvidence: boolean;
  isCommunityReproduction: boolean;
  repositoryIsPublic: boolean;
}) {
  if (!args.repositoryIsPublic) return "unknown" as const;
  if (args.hasCuratedRepositoryEvidence && ORGANIZATION_TO_LAB.has(args.owner.toLowerCase())) {
    return "verified" as const;
  }
  if (!args.hasRelationshipEvidence || args.isCommunityReproduction) return "candidate" as const;
  return ORGANIZATION_TO_LAB.has(args.owner.toLowerCase()) ? "verified" as const : "strong" as const;
}

async function main() {
  const papers = await loadCollection();
  if (papers.length !== 1_018) throw new Error(`Expected 1018 papers, found ${papers.length}`);
  if (new Set(papers.map((paper) => paper.collectionId)).size !== papers.length) {
    throw new Error("Collection IDs are not unique");
  }

  await mkdir(new URL("../metadata/raw/", import.meta.url), { recursive: true });
  const generatedAt = new Date().toISOString();
  const hfRecords = await fetchHuggingFaceRecords(papers);
  const curatedLabEvidence = papers
    .filter((paper) => paper.officialLab && paper.officialLabEvidenceUrl && paper.officialLabSource)
    .map((paper) => ({
      collectionId: paper.collectionId,
      arxivId: paper.arxivId,
      officialLab: paper.officialLab,
      officialLabEvidenceUrl: paper.officialLabEvidenceUrl,
      officialLabSource: paper.officialLabSource,
    }));

  await writeJson(HF_OUTPUT, {
    generatedAt,
    source: HF_ENDPOINT,
    matchingRule: "Exact canonical arXiv ID",
    collectionSize: papers.length,
    requestedArxivIds: papers.filter((paper) => paper.arxivId).length,
    records: hfRecords,
    curatedLabEvidence,
  });

  const candidates = buildGithubCandidates(papers, hfRecords);
  const cachedGithubRecords = await readExistingGithubRecords();
  const githubRecords = await mapConcurrent(candidates, GITHUB_CONCURRENCY, async (candidate) => {
    const key = `${candidate.paper.collectionId}:${candidate.repository.toLowerCase()}`;
    const previous = cachedGithubRecords.get(key);
    if (!REFRESH && previous?.status === "resolved") {
      const owner = previous.owner;
      const mappedOfficialLab = typeof owner === "string"
        ? ORGANIZATION_TO_LAB.get(owner.toLowerCase()) ?? null
        : null;
      const relationshipEvidence = previous.relationshipEvidence;
      const hasCuratedRepositoryEvidence = candidateHasCuratedRepositoryEvidence(candidate);
      const repositoryConfidence = classifyRepository({
        owner: owner ?? "",
        hasRelationshipEvidence: relationshipEvidence.length > 0,
        hasCuratedRepositoryEvidence,
        isCommunityReproduction: previous.communityReproduction,
        repositoryIsPublic: previous.public,
      });
      const accepted = repositoryConfidence === "verified" || repositoryConfidence === "strong";
      return {
        ...previous,
        discoveredFrom: candidate.discoveredFrom,
        discoveryEvidenceUrls: candidate.discoveryEvidenceUrls,
        mappedOfficialLab,
        mappedOfficialLabEvidenceUrl: mappedOfficialLab ? previous.repositoryUrl : null,
        accepted,
        githubRepositorySource: accepted
          ? mappedOfficialLab
            ? "official-lab" as const
            : candidate.discoveredFrom.includes("huggingface-paper")
              ? "huggingface-paper" as const
              : "author-project" as const
          : null,
        repositoryConfidence,
      };
    }
    return validateGithubCandidate(candidate);
  });
  await writeJson(GITHUB_OUTPUT, {
    generatedAt: new Date().toISOString(),
    source: "https://api.github.com",
    retrievalMethod: "Authenticated GitHub CLI",
    candidatesDiscovered: candidates.length,
    records: githubRecords,
  });

  const hfOk = hfRecords.filter((record) => record.status === "ok").length;
  const accepted = githubRecords.filter((record) => record.accepted).length;
  const verified = githubRecords.filter((record) => record.repositoryConfidence === "verified").length;
  const strong = githubRecords.filter((record) => record.repositoryConfidence === "strong").length;
  console.log(JSON.stringify({ papers: papers.length, hfOk, githubCandidates: candidates.length, accepted, verified, strong }, null, 2));
}

async function loadCollection(): Promise<CollectionPaper[]> {
  const core = JSON.parse(await readFile(new URL("../corpus/papers.json", import.meta.url), "utf8")) as {
    papers: Array<{
      arxivId: string;
      title: string;
      landingUrl: string;
      officialLab: string | null;
      officialLabEvidenceUrl: string | null;
    }>;
  };
  const supplemental = JSON.parse(
    await readFile(new URL("../supplemental/together-research/sources.json", import.meta.url), "utf8"),
  ) as Array<{
    id: string;
    arxivId?: string;
    title: string;
    landingPage: string;
    officialLab?: string | null;
    officialLabEvidenceUrl?: string | null;
  }>;
  return [
    ...core.papers.map((paper) => ({
      collectionId: `arxiv-${paper.arxivId}`,
      arxivId: paper.arxivId,
      title: paper.title,
      landingUrl: paper.landingUrl,
      officialLab: paper.officialLab,
      officialLabEvidenceUrl: paper.officialLabEvidenceUrl,
      officialLabSource: paper.officialLab ? "curated-seed" as const : null,
    })),
    ...supplemental.map((paper) => ({
      collectionId: paper.id,
      arxivId: paper.arxivId ?? null,
      title: paper.title,
      landingUrl: paper.landingPage,
      officialLab: paper.officialLab ?? null,
      officialLabEvidenceUrl: paper.officialLabEvidenceUrl ?? null,
      officialLabSource: paper.officialLab ? "together-research" as const : null,
    })),
  ];
}

async function fetchHuggingFaceRecords(papers: CollectionPaper[]): Promise<HfRecord[]> {
  const cached = await readExistingHfRecords();
  return mapConcurrent(papers, HF_CONCURRENCY, async (paper) => {
    if (!paper.arxivId) {
      return emptyHfRecord(paper, "unavailable-without-arxiv-id", "Paper does not have a canonical arXiv ID");
    }
    const previous = cached.get(paper.collectionId);
    if (!REFRESH && previous?.status === "ok") {
      return {
        ...previous,
        mappedOfficialLabEvidenceUrl: previous.mappedOfficialLab
          ? `https://huggingface.co/papers/${paper.arxivId}`
          : null,
      };
    }
    const retrievedAt = new Date().toISOString();
    try {
      const response = await fetchWithRetry(`${HF_ENDPOINT}/${encodeURIComponent(paper.arxivId)}`);
      if (response.status === 404) return emptyHfRecord(paper, "not-found", null, retrievedAt);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const value = await response.json() as HfResponse;
      if (value.id !== paper.arxivId) {
        throw new Error(`Hugging Face returned ${value.id ?? "no ID"} for ${paper.arxivId}`);
      }
      const organizationName = cleanString(value.organization?.name);
      const mappedOfficialLab = organizationName
        ? ORGANIZATION_TO_LAB.get(organizationName.toLowerCase()) ?? null
        : null;
      return {
        collectionId: paper.collectionId,
        arxivId: paper.arxivId,
        status: "ok",
        retrievedAt,
        organization: value.organization
          ? { name: organizationName, fullname: cleanString(value.organization.fullname) }
          : null,
        projectPage: cleanString(value.projectPage),
        githubRepo: cleanString(value.githubRepo),
        githubRepoAddedBy: cleanString(value.githubRepoAddedBy),
        githubStars: Number.isInteger(value.githubStars) ? value.githubStars! : null,
        mappedOfficialLab,
        mappedOfficialLabEvidenceUrl: mappedOfficialLab
          ? `https://huggingface.co/papers/${paper.arxivId}`
          : null,
        error: null,
      };
    } catch (error) {
      return emptyHfRecord(paper, "error", errorMessage(error), retrievedAt);
    }
  });
}

function emptyHfRecord(
  paper: CollectionPaper,
  status: HfRecord["status"],
  error: string | null,
  retrievedAt = new Date().toISOString(),
): HfRecord {
  return {
    collectionId: paper.collectionId,
    arxivId: paper.arxivId,
    status,
    retrievedAt,
    organization: null,
    projectPage: null,
    githubRepo: null,
    githubRepoAddedBy: null,
    githubStars: null,
    mappedOfficialLab: null,
    mappedOfficialLabEvidenceUrl: null,
    error,
  };
}

async function readExistingHfRecords() {
  try {
    const existing = JSON.parse(await readFile(HF_OUTPUT, "utf8")) as { records?: HfRecord[] };
    return new Map((existing.records ?? []).map((record) => [record.collectionId, record]));
  } catch {
    return new Map<string, HfRecord>();
  }
}

async function readExistingGithubRecords() {
  try {
    const existing = JSON.parse(await readFile(GITHUB_OUTPUT, "utf8")) as { records?: GithubRecord[] };
    return new Map(
      (existing.records ?? []).map((record) => [
        `${record.collectionId}:${record.repository.toLowerCase()}`,
        record,
      ]),
    );
  } catch {
    return new Map<string, GithubRecord>();
  }
}

function buildGithubCandidates(papers: CollectionPaper[], records: HfRecord[]): GithubCandidate[] {
  const paperById = new Map(papers.map((paper) => [paper.collectionId, paper]));
  const candidates = new Map<string, GithubCandidate>();
  const add = (paper: CollectionPaper, url: string | null, source: DiscoverySource, evidenceUrl: string) => {
    if (!url) return;
    const repository = normalizeGithubRepository(url);
    if (!repository) return;
    const key = `${paper.collectionId}:${repository.toLowerCase()}`;
    const existing = candidates.get(key);
    if (existing) {
      if (!existing.discoveredFrom.includes(source)) existing.discoveredFrom.push(source);
      if (!existing.discoveryEvidenceUrls.includes(evidenceUrl)) existing.discoveryEvidenceUrls.push(evidenceUrl);
      return;
    }
    candidates.set(key, { paper, repository, discoveredFrom: [source], discoveryEvidenceUrls: [evidenceUrl] });
  };
  for (const record of records) {
    const paper = paperById.get(record.collectionId);
    if (!paper) continue;
    add(paper, record.githubRepo, "huggingface-paper", `https://huggingface.co/papers/${record.arxivId}`);
    add(paper, record.projectPage, "huggingface-paper", `https://huggingface.co/papers/${record.arxivId}`);
  }
  for (const paper of papers) {
    const source = paper.officialLabSource;
    if (source) add(paper, paper.officialLabEvidenceUrl, source, paper.officialLabEvidenceUrl!);
  }
  return [...candidates.values()].sort((a, b) =>
    a.paper.collectionId.localeCompare(b.paper.collectionId) || a.repository.localeCompare(b.repository)
  );
}

async function validateGithubCandidate(candidate: GithubCandidate) {
  const checkedAt = new Date().toISOString();
  try {
    const repository = await ghJson<GhRepository>(`repos/${candidate.repository}`);
    const readme = await ghRaw(`repos/${candidate.repository}/readme`);
    const evidence = findPaperEvidence(candidate.paper, repository, readme);
    const communityReproduction = isCommunityReproduction(repository.description, readme);
    const repositoryIsPublic = !repository.private;
    const hasCuratedRepositoryEvidence = candidateHasCuratedRepositoryEvidence(candidate);
    const repositoryConfidence = classifyRepository({
      owner: repository.owner.login,
      hasRelationshipEvidence: evidence.length > 0,
      hasCuratedRepositoryEvidence,
      isCommunityReproduction: communityReproduction,
      repositoryIsPublic,
    });
    const accepted = repositoryConfidence === "verified" || repositoryConfidence === "strong";
    const officialLab = ORGANIZATION_TO_LAB.get(repository.owner.login.toLowerCase()) ?? null;
    return {
      collectionId: candidate.paper.collectionId,
      arxivId: candidate.paper.arxivId,
      candidateUrl: `https://github.com/${candidate.repository}`,
      discoveredFrom: candidate.discoveredFrom,
      discoveryEvidenceUrls: candidate.discoveryEvidenceUrls,
      status: "resolved" as const,
      checkedAt,
      repository: repository.full_name,
      repositoryUrl: repository.html_url,
      owner: repository.owner.login,
      name: repository.name,
      public: repositoryIsPublic,
      archived: repository.archived,
      defaultBranch: repository.default_branch,
      description: repository.description,
      homepage: cleanString(repository.homepage),
      githubStars: repository.stargazers_count,
      githubStarsSnapshotAt: checkedAt,
      relationshipEvidence: evidence,
      githubRepositoryEvidenceUrl: evidence.length > 0
        ? evidence.some((item) => item.location === "readme")
          ? `${repository.html_url}#readme`
          : repository.html_url
        : hasCuratedRepositoryEvidence
          ? repository.html_url
        : null,
      mappedOfficialLab: officialLab,
      mappedOfficialLabEvidenceUrl: officialLab ? repository.html_url : null,
      communityReproduction,
      accepted,
      githubRepositorySource: accepted
        ? officialLab
          ? "official-lab" as const
          : candidate.discoveredFrom.includes("huggingface-paper")
            ? "huggingface-paper" as const
            : "author-project" as const
        : null,
      repositoryConfidence,
      rejectionReason: accepted
        ? null
        : !repositoryIsPublic
          ? "Repository is private"
          : communityReproduction
            ? "Repository identifies itself as a community reproduction"
            : "No required paper relationship evidence found",
      error: null,
    };
  } catch (error) {
    return {
      collectionId: candidate.paper.collectionId,
      arxivId: candidate.paper.arxivId,
      candidateUrl: `https://github.com/${candidate.repository}`,
      discoveredFrom: candidate.discoveredFrom,
      discoveryEvidenceUrls: candidate.discoveryEvidenceUrls,
      status: "error" as const,
      checkedAt,
      repository: candidate.repository,
      repositoryUrl: null,
      owner: candidate.repository.split("/")[0] ?? null,
      name: candidate.repository.split("/")[1] ?? null,
      public: null,
      archived: null,
      defaultBranch: null,
      description: null,
      homepage: null,
      githubStars: null,
      githubStarsSnapshotAt: null,
      relationshipEvidence: [],
      githubRepositoryEvidenceUrl: null,
      mappedOfficialLab: null,
      mappedOfficialLabEvidenceUrl: null,
      communityReproduction: false,
      accepted: false,
      githubRepositorySource: null,
      repositoryConfidence: "unknown" as const,
      rejectionReason: "GitHub repository could not be resolved",
      error: errorMessage(error),
    };
  }
}

async function fetchWithRetry(url: string) {
  const token = await readHuggingFaceToken();
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const init: RequestInit = { signal: AbortSignal.timeout(30_000) };
      if (token) init.headers = { Authorization: `Bearer ${token}` };
      const response = await fetch(url, init);
      if (response.status !== 429 && response.status < 500) return response;
      if (attempt === MAX_ATTEMPTS) return response;
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
      const resetSeconds = parseRateLimitReset(response.headers.get("ratelimit"));
      const waitMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1_000
        : resetSeconds !== null
          ? (resetSeconds + 1) * 1_000
          : retryDelay(attempt);
      await sleep(waitMs);
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      await sleep(retryDelay(attempt));
    }
  }
  throw new Error("Retry loop exhausted");
}

async function readHuggingFaceToken() {
  if (process.env.HF_TOKEN) return process.env.HF_TOKEN.trim();
  try {
    return (await readFile(new URL(`file://${process.env.HOME}/.cache/huggingface/token`), "utf8")).trim();
  } catch {
    return null;
  }
}

async function ghJson<T>(endpoint: string): Promise<T> {
  const { stdout } = await gh(["api", endpoint], 3);
  return JSON.parse(stdout) as T;
}

async function ghRaw(endpoint: string) {
  try {
    const { stdout } = await gh(["api", endpoint, "-H", "Accept: application/vnd.github.raw+json"], 3);
    return stdout;
  } catch {
    return "";
  }
}

async function gh(args: string[], attempts: number): Promise<{ stdout: string; stderr: string }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await execFileAsync("gh", args, { maxBuffer: 4 * 1024 * 1024 });
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(retryDelay(attempt));
    }
  }
  throw lastError;
}

async function mapConcurrent<T, U>(items: T[], concurrency: number, mapper: (item: T) => Promise<U>): Promise<U[]> {
  const results = new Array<U>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]!);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function urlEvidenceMatches(value: string, landingUrl: string, arxivId: string | null) {
  const lower = value.toLowerCase();
  const urls = [landingUrl, landingUrl.replace(/v\d+$/i, "")];
  if (arxivId) {
    urls.push(`https://arxiv.org/abs/${arxivId}`, `http://arxiv.org/abs/${arxivId}`);
  }
  return urls.some((url) => lower.includes(url.toLowerCase()));
}

function containsToken(value: string, token: string) {
  return new RegExp(`(^|[^0-9])${escapeRegex(token)}([^0-9]|$)`, "i").test(value);
}

function candidateHasCuratedRepositoryEvidence(candidate: GithubCandidate) {
  if (!candidate.discoveredFrom.includes("curated-seed")) return false;
  const normalizedCandidate = normalizeGithubRepository(`https://github.com/${candidate.repository}`)?.toLowerCase();
  return candidate.discoveryEvidenceUrls.some(
    (url) => normalizeGithubRepository(url)?.toLowerCase() === normalizedCandidate,
  );
}

function isCommunityReproduction(description: string | null, readme: string) {
  const text = `${description ?? ""}\n${readme.slice(0, 8_000)}`;
  return /\b(unofficial|community)\s+(reproduction|replication|implementation)\b|\b(reproduction|replication)\s+of\b/i.test(text);
}

function normalizeForMatch(value: string) {
  return value.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseRateLimitReset(value: string | null) {
  const match = value?.match(/(?:^|;)t=(\d+)/);
  return match ? Number(match[1]) : null;
}

function retryDelay(attempt: number) {
  return Math.min(30_000, 500 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function writeJson(url: URL, value: unknown) {
  await writeFile(url, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  await main();
}
