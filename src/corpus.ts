import { XMLParser } from "fast-xml-parser";

export const CORPUS_START = "2025-08-04";
export const CORPUS_END = "2026-08-04";
export const CORPUS_SIZE = 1_000;

export const TARGET_LABS = [
  "OpenAI",
  "Anthropic",
  "DeepSeek",
  "MiniMax",
  "Moonshot AI / Kimi",
] as const;

export type TargetLab = (typeof TARGET_LABS)[number];

export type DailyPaper = {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  submittedOnDailyAt: string;
  hfUpvotes: number;
};

export type OfficialLabSeed = {
  lab: TargetLab;
  arxivId: string;
  officialEvidenceUrl: string;
};

export type ArxivMetadata = {
  arxivId: string;
  versionedArxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  updatedAt: string;
  categories: string[];
  primaryCategory: string;
  landingUrl: string;
  pdfUrl: string;
};

export type SelectedPaper = DailyPaper & {
  officialLab: TargetLab | null;
  officialEvidenceUrl: string | null;
  selectionReasons: Array<"hf-upvotes" | "official-lab">;
};

type HfPaper = {
  id: string;
  authors?: Array<{ name?: string }>;
  publishedAt: string;
  submittedOnDailyAt: string;
  title: string;
  summary: string;
  upvotes?: number;
};

type HfDailyPaperRow = { paper: HfPaper };

export function toDailyPaper(row: HfDailyPaperRow): DailyPaper {
  return {
    arxivId: canonicalArxivId(row.paper.id),
    title: normalizeWhitespace(row.paper.title),
    authors: (row.paper.authors ?? [])
      .map((author) => normalizeWhitespace(author.name ?? ""))
      .filter(Boolean),
    abstract: normalizeWhitespace(row.paper.summary),
    publishedAt: row.paper.publishedAt,
    submittedOnDailyAt: row.paper.submittedOnDailyAt,
    hfUpvotes: row.paper.upvotes ?? 0,
  };
}

export function selectCorpus(
  dailyPapers: DailyPaper[],
  officialSeeds: OfficialLabSeed[],
  limit = CORPUS_SIZE,
): SelectedPaper[] {
  if (officialSeeds.length > limit) {
    throw new Error(`Official seed count ${officialSeeds.length} exceeds corpus limit ${limit}`);
  }

  const popularById = new Map<string, DailyPaper>();
  for (const paper of dailyPapers) {
    const id = canonicalArxivId(paper.arxivId);
    const current = popularById.get(id);
    if (!current || comparePopularity(paper, current) < 0) {
      popularById.set(id, { ...paper, arxivId: id });
    }
  }

  const seedById = new Map<string, OfficialLabSeed>();
  for (const seed of officialSeeds) {
    const id = canonicalArxivId(seed.arxivId);
    const duplicate = seedById.get(id);
    if (duplicate && duplicate.lab !== seed.lab) {
      throw new Error(`Conflicting official labs for ${id}: ${duplicate.lab} and ${seed.lab}`);
    }
    seedById.set(id, { ...seed, arxivId: id });
  }

  const selectedIds = new Set(seedById.keys());
  const popular = [...popularById.values()].sort(comparePopularity);
  for (const paper of popular) {
    if (selectedIds.size >= limit) break;
    selectedIds.add(paper.arxivId);
  }

  if (selectedIds.size < limit) {
    throw new Error(`Only ${selectedIds.size} unique papers are available for a ${limit}-paper corpus`);
  }

  const selected = [...selectedIds].map((arxivId): SelectedPaper => {
    const paper = popularById.get(arxivId);
    const seed = seedById.get(arxivId);
    if (!paper) {
      return {
        arxivId,
        title: "",
        authors: [],
        abstract: "",
        publishedAt: "",
        submittedOnDailyAt: "",
        hfUpvotes: 0,
        officialLab: seed?.lab ?? null,
        officialEvidenceUrl: seed?.officialEvidenceUrl ?? null,
        selectionReasons: ["official-lab"],
      };
    }
    return {
      ...paper,
      officialLab: seed?.lab ?? null,
      officialEvidenceUrl: seed?.officialEvidenceUrl ?? null,
      selectionReasons: seed
        ? ["hf-upvotes", "official-lab"]
        : ["hf-upvotes"],
    };
  });

  return selected.sort(comparePopularity);
}

export function parseArxivFeed(xml: string): ArxivMetadata[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
  });
  const feed = parser.parse(xml)?.feed;
  const entries = asArray<Record<string, unknown>>(feed?.entry);
  return entries.map((entry) => {
    const idUrl = String(entry.id ?? "");
    const versionMatch = idUrl.match(/(\d{4}\.\d{4,5})v(\d+)$/);
    if (!versionMatch) throw new Error(`Invalid arXiv entry id: ${idUrl}`);
    const arxivId = versionMatch[1]!;
    const versionedArxivId = `${arxivId}v${versionMatch[2]!}`;
    const links = asArray(entry.link as Record<string, unknown> | Record<string, unknown>[] | undefined);
    const categories = asArray(entry.category as Record<string, unknown> | Record<string, unknown>[] | undefined)
      .map((category) => String(category.term ?? ""))
      .filter(Boolean);
    const authors = asArray(entry.author as Record<string, unknown> | Record<string, unknown>[] | undefined)
      .map((author) => normalizeWhitespace(String(author.name ?? "")))
      .filter(Boolean);
    const primary = entry["arxiv:primary_category"] as
      | Record<string, unknown>
      | undefined;
    return {
      arxivId,
      versionedArxivId,
      title: normalizeWhitespace(String(entry.title ?? "")),
      authors,
      abstract: normalizeWhitespace(String(entry.summary ?? "")),
      publishedAt: String(entry.published ?? ""),
      updatedAt: String(entry.updated ?? ""),
      categories,
      primaryCategory: String(primary?.term ?? categories[0] ?? ""),
      landingUrl:
        String(links.find((link) => link.rel === "alternate")?.href ?? "") ||
        `https://arxiv.org/abs/${versionedArxivId}`,
      pdfUrl:
        String(links.find((link) => link.type === "application/pdf")?.href ?? "") ||
        `https://arxiv.org/pdf/${versionedArxivId}`,
    };
  });
}

export function canonicalArxivId(value: string) {
  const match = value.trim().match(/(?:abs\/)?(\d{4}\.\d{4,5})(?:v\d+)?$/);
  if (!match) throw new Error(`Invalid arXiv id: ${value}`);
  return match[1]!;
}

export function isPublishedInCorpusWindow(
  publishedAt: string,
  start = CORPUS_START,
  end = CORPUS_END,
) {
  const published = new Date(publishedAt);
  const startAt = new Date(`${start}T00:00:00Z`);
  const endExclusive = new Date(`${end}T00:00:00Z`);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return !Number.isNaN(published.valueOf()) && published >= startAt && published < endExclusive;
}

export function classifyTopics(title: string, abstract: string) {
  const text = `${title} ${abstract}`;
  const definitions = [
    ["llms-agents-reasoning", /\b(llm|language model|agent|reasoning|chain.of.thought|reinforcement learning|rlhf|alignment|gpt|claude|gemini|llama|qwen|deepseek)\b/i],
    ["vision-multimodal-generation", /\b(vision|image|video|multimodal|diffusion|visual|3d|text.to.image|world model)\b/i],
    ["robotics-embodied-ai", /\b(robot|robotic|embodied|manipulation|locomotion|autonomous driv|navigation)\b/i],
    ["systems-efficiency", /\b(inference|serving|quantiz|compression|efficient|training system|mixture.of.experts|sparse attention|kernel|gpu)\b/i],
    ["science-medicine", /\b(scientific|medicine|medical|biology|protein|drug|health|physics|chemistry|materials)\b/i],
  ] as const;
  return definitions.filter(([, pattern]) => pattern.test(text)).map(([tag]) => tag);
}

export function classifyModelFamilies(title: string, abstract: string) {
  const text = `${title} ${abstract}`;
  const definitions = [
    ["OpenAI", /\b(openai|gpt[- ]?[45]|o[134](?:[- ]|\b)|codex)\b/i],
    ["Anthropic", /\b(anthropic|claude)\b/i],
    ["Google", /\b(google deepmind|deepmind|gemini|gemma)\b/i],
    ["Meta", /\b(meta ai|llama)\b/i],
    ["DeepSeek", /\bdeepseek\b/i],
    ["Qwen", /\b(qwen|alibaba)\b/i],
    ["Kimi", /\b(kimi|moonshot ai)\b/i],
    ["MiniMax", /\bminimax[- ]m[123]\b/i],
    ["GLM", /\b(chatglm|glm[- ]?[45]|zhipu|z\.ai)\b/i],
    ["Mistral", /\b(mistral|mixtral)\b/i],
    ["xAI", /\b(xai|x\.ai|grok)\b/i],
    ["NVIDIA", /\b(nvidia|nemotron)\b/i],
  ] as const;
  return definitions.filter(([, pattern]) => pattern.test(text)).map(([family]) => family);
}

function comparePopularity(a: DailyPaper, b: DailyPaper) {
  return b.hfUpvotes - a.hfUpvotes || a.arxivId.localeCompare(b.arxivId);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}
