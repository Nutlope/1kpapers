// Pure core of the open-model / new-paper tracker. No network, no file system:
// discover-tracker.ts does the fetching and writing, this module decides what
// counts. Kept separate so the selection rules are unit-testable and so the
// benchmark corpus code (corpus.ts, discover.ts) stays untouched — that corpus
// is a frozen, reproducible 1,000-paper window, and the tracker is the opposite:
// a rolling view that is expected to change every run.

import { canonicalArxivId, classifyModelFamilies, classifyTopics, toDailyPaper } from "./corpus.js";

export const TRACKER_SCHEMA_VERSION = 1;

// The Hub's "newest" sort is mostly noise (fresh zero-download fine-tunes), so
// the tracker starts from trending and then requires the repo to be recent.
// These are the pipelines that matter for "new open models"; image/video gen is
// in because those releases (FLUX, Wan, Hunyuan) are tracked the same way.
export const TRACKED_PIPELINES = [
  "text-generation",
  "image-text-to-text",
  "any-to-any",
  "text-to-image",
  "text-to-video",
  "automatic-speech-recognition",
  "text-to-speech",
] as const;

export type HfModelRow = {
  id: string;
  author?: string;
  createdAt?: string;
  likes?: number;
  downloads?: number;
  trendingScore?: number;
  pipeline_tag?: string;
  tags?: string[];
  private?: boolean;
  gated?: boolean | string;
  safetensors?: { total?: number } | null;
  cardData?: { license?: string | string[] } | null;
};

export type TrackedModel = {
  id: string;
  author: string;
  url: string;
  pipeline: string;
  createdAt: string;
  likes: number;
  downloads: number;
  trendingScore: number;
  parameters: number | null;
  license: string | null;
  gated: boolean;
  // The repo this one was fine-tuned from, if any. Null means it is presented
  // as an original release. Quantizations, adapters and merges never get here.
  derivedFrom: string | null;
  arxivIds: string[];
  modelFamilies: string[];
  source: "huggingface-models-trending";
};

export type TrackedPaper = {
  arxivId: string;
  title: string;
  authors: string[];
  abstract: string;
  publishedAt: string;
  submittedOnDailyAt: string | null;
  hfUpvotes: number;
  hfUrl: string;
  arxivUrl: string;
  topicTags: string[];
  modelFamiliesMentioned: string[];
  linkedModelIds: string[];
  source: "huggingface-daily-papers";
};

export type TrackerFile<T> = {
  schemaVersion: number;
  generatedAt: string;
  window: { start: string; end: string; days: number };
  source: string;
  count: number;
  items: T[];
};

// Tags like "base_model:quantized:org/name" describe how a repo relates to its
// parent. Re-uploads in another precision, LoRA adapters and merges are not new
// models, and they are most of what trends right after a big release.
const DERIVATIVE_RELATIONS = ["quantized", "adapter", "merge"] as const;

// Uploaders label base_model relations by hand and often call a quantization a
// "finetune", so the file format is the more honest signal for a repack.
const QUANTIZED_FORMAT_TAGS = new Set(["gguf", "gptq", "awq", "exl2", "mlx"]);

export function isDerivativeRepack(tags: string[] = []) {
  return tags.some(
    (tag) =>
      QUANTIZED_FORMAT_TAGS.has(tag) ||
      DERIVATIVE_RELATIONS.some((relation) => tag.startsWith(`base_model:${relation}:`)),
  );
}

export function fineTunedFrom(tags: string[] = []) {
  const tag = tags.find((value) => value.startsWith("base_model:finetune:"));
  return tag ? tag.slice("base_model:finetune:".length) : null;
}

// canonicalArxivId throws on anything that is not a modern NNNN.NNNNN id, and
// model cards do carry old-style ids ("hep-th/9901001") and typos. One bad tag
// must not sink the whole run, so those are skipped rather than surfaced.
export function safeArxivId(value: string) {
  try {
    return canonicalArxivId(value);
  } catch {
    return null;
  }
}

export function arxivIdsFromTags(tags: string[] = []) {
  const ids = tags
    .filter((tag) => tag.startsWith("arxiv:"))
    .map((tag) => safeArxivId(tag.slice("arxiv:".length)))
    .filter((id): id is string => id !== null);
  return [...new Set(ids)].sort();
}

function firstLicense(row: HfModelRow) {
  const fromCard = row.cardData?.license;
  if (Array.isArray(fromCard)) return fromCard[0] ?? null;
  if (fromCard) return fromCard;
  const tag = row.tags?.find((value) => value.startsWith("license:"));
  return tag ? tag.slice("license:".length) : null;
}

export function windowStart(now: Date, days: number) {
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - days);
  return start;
}

// Returns null for anything the tracker should not show: private or missing
// data, derivative repacks, or repos created before the window. Gated repos
// stay in (Llama/Gemma-style releases are gated but still open weights); the
// flag lets the UI say so.
export function toTrackedModel(row: HfModelRow, now: Date, windowDays: number): TrackedModel | null {
  if (!row?.id || row.private) return null;
  if (!row.createdAt || !row.pipeline_tag) return null;
  const created = new Date(row.createdAt);
  if (Number.isNaN(created.getTime())) return null;
  if (created < windowStart(now, windowDays) || created > now) return null;
  const tags = row.tags ?? [];
  if (isDerivativeRepack(tags)) return null;

  const author = row.author ?? row.id.split("/")[0] ?? "";
  return {
    id: row.id,
    author,
    url: `https://huggingface.co/${row.id}`,
    pipeline: row.pipeline_tag,
    createdAt: created.toISOString(),
    likes: row.likes ?? 0,
    downloads: row.downloads ?? 0,
    trendingScore: row.trendingScore ?? 0,
    parameters: row.safetensors?.total ?? null,
    license: firstLicense(row),
    gated: Boolean(row.gated),
    derivedFrom: fineTunedFrom(tags),
    arxivIds: arxivIdsFromTags(tags),
    modelFamilies: classifyModelFamilies(row.id, ""),
    source: "huggingface-models-trending",
  };
}

// Same repo can come back from several pipeline queries; keep the first (the
// lists are already trending-sorted) and order the merged set by trending.
export function mergeModels(lists: TrackedModel[][], limit: number) {
  const byId = new Map<string, TrackedModel>();
  for (const list of lists) {
    for (const model of list) if (!byId.has(model.id)) byId.set(model.id, model);
  }
  return [...byId.values()]
    .sort((a, b) => b.trendingScore - a.trendingScore || b.likes - a.likes || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function toTrackedPaper(
  row: Parameters<typeof toDailyPaper>[0],
  start: Date,
  end: Date,
): TrackedPaper | null {
  if (!row?.paper?.id || !row.paper.title || !safeArxivId(row.paper.id)) return null;
  const paper = toDailyPaper(row);
  const published = new Date(paper.publishedAt);
  if (Number.isNaN(published.getTime()) || published < start || published > end) return null;
  return {
    arxivId: paper.arxivId,
    title: paper.title,
    authors: paper.authors,
    abstract: paper.abstract,
    publishedAt: published.toISOString(),
    submittedOnDailyAt: paper.submittedOnDailyAt ?? null,
    hfUpvotes: paper.hfUpvotes,
    hfUrl: `https://huggingface.co/papers/${paper.arxivId}`,
    arxivUrl: `https://arxiv.org/abs/${paper.arxivId}`,
    topicTags: classifyTopics(paper.title, paper.abstract),
    modelFamiliesMentioned: classifyModelFamilies(paper.title, paper.abstract),
    linkedModelIds: [],
    source: "huggingface-daily-papers",
  };
}

// Daily Papers lists the same arXiv ID once per day it was featured, with a
// growing upvote count. Keep the highest count per paper.
export function mergePapers(papers: TrackedPaper[], limit: number) {
  const byId = new Map<string, TrackedPaper>();
  for (const paper of papers) {
    const current = byId.get(paper.arxivId);
    if (!current || paper.hfUpvotes > current.hfUpvotes) byId.set(paper.arxivId, paper);
  }
  return [...byId.values()]
    .sort((a, b) => b.hfUpvotes - a.hfUpvotes || b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

// Cross-link: a paper "has a model" when a tracked model's card cites it.
export function linkPapersToModels(papers: TrackedPaper[], models: TrackedModel[]) {
  const modelsByArxiv = new Map<string, string[]>();
  for (const model of models) {
    for (const id of model.arxivIds) {
      modelsByArxiv.set(id, [...(modelsByArxiv.get(id) ?? []), model.id]);
    }
  }
  return papers.map((paper) => ({ ...paper, linkedModelIds: modelsByArxiv.get(paper.arxivId) ?? [] }));
}

// Guards the writer: a run that comes back thin (API outage, shape change,
// rate limit that slipped through) must not replace a good file with a bad one.
export function validateTrackerItems<T>(items: T[], minimum: number, keyOf: (item: T) => string) {
  const problems: string[] = [];
  if (items.length < minimum) problems.push(`only ${items.length} items (minimum ${minimum})`);
  const keys = items.map(keyOf);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicates.length) problems.push(`duplicate keys: ${[...new Set(duplicates)].slice(0, 5).join(", ")}`);
  return problems;
}

// Only the real Hub ever sees the token. --hub-base exists so the failure path
// can be exercised against a dead or fake host, and a bearer token has no
// business travelling there.
export const HF_HUB_ORIGIN = "https://huggingface.co";

export function authHeaders(url: URL, token: string | null): Record<string, string> {
  return token && url.origin === HF_HUB_ORIGIN ? { Authorization: `Bearer ${token}` } : {};
}

// The "thin run" floor can't exceed what was asked for: --model-limit=5 that
// returns 5 good items is a success, not an empty week.
export function minimumItems(floor: number, requested: number) {
  return Math.min(floor, requested);
}

export type FileOps = {
  writeFile: (file: string, data: string) => Promise<void>;
  rename: (from: string, to: string) => Promise<void>;
  rm: (file: string, options: { force: true }) => Promise<void>;
};

// models.json and papers.json are one generation, so we stage both before
// touching either. A failure while staging deletes the temp files and leaves
// the previous pair exactly as it was. What remains is the gap between the two
// renames: a crash in that instant can still pair a new models.json with the
// old papers.json. Closing it fully means a versioned directory plus a pointer
// file, which felt like too much machinery for a cache readers rebuild weekly.
export async function writeFilesTogether(files: Array<{ target: string; content: string }>, fs: FileOps, tag: string) {
  const staged = files.map((file) => ({ ...file, temp: `${file.target}.${tag}.tmp` }));
  try {
    for (const file of staged) await fs.writeFile(file.temp, file.content);
  } catch (error) {
    await Promise.all(staged.map((file) => fs.rm(file.temp, { force: true })));
    throw error;
  }
  try {
    for (const file of staged) await fs.rename(file.temp, file.target);
  } finally {
    // A rename that throws would otherwise leave its temp file behind; the ones
    // already renamed are gone, so force-removing all of them is safe.
    await Promise.all(staged.map((file) => fs.rm(file.temp, { force: true })));
  }
}
