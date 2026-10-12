// Refreshes the rolling tracker data: new open models trending on the Hugging
// Face Hub, and the most-upvoted Daily Papers from the last N days.
//
//   HF_TOKEN=... pnpm tracker                 # defaults: 30 days of papers, 120 of models
//   pnpm tracker -- --paper-days=14 --model-days=60 --out=site/data/tracker
//
// Output: <out>/papers.json and <out>/models.json, plain JSON that a site page
// or a scheduled job can read. Nothing here touches the frozen benchmark
// corpus or the public bucket.
//
// Failure policy (the reason this file exists separately from discover.ts):
// every fetch retries with backoff, and a run is validated before anything is
// written. A thin or malformed result keeps the previous file byte-for-byte and
// exits non-zero, so a scheduled refresh never publishes an empty tracker.
//
// The token is optional (the endpoints are public) but raises rate limits. It
// is read from the environment only and never logged.

import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  authHeaders,
  linkPapersToModels,
  mergeModels,
  mergePapers,
  minimumItems,
  toTrackedModel,
  toTrackedPaper,
  TRACKED_PIPELINES,
  TRACKER_SCHEMA_VERSION,
  validateTrackerItems,
  windowStart,
  writeFilesTogether,
  type HfModelRow,
  type TrackedModel,
  type TrackedPaper,
  type TrackerFile,
} from "./tracker.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const paperDays = positiveInt(args["paper-days"] ?? "30", "paper-days");
const modelDays = positiveInt(args["model-days"] ?? "120", "model-days");
const paperLimit = positiveInt(args["paper-limit"] ?? "60", "paper-limit");
const modelLimit = positiveInt(args["model-limit"] ?? "60", "model-limit");
const outDir = path.resolve(args.out ?? "site/data/tracker");
// Test hook for the failure path: point at a dead host and confirm the
// previous files survive. Not meant for normal use, and the token is only
// ever sent to huggingface.co (see authHeaders).
const hubBase = args["hub-base"] ?? "https://huggingface.co";
const token = process.env.HF_TOKEN?.trim() || null;

const now = new Date();
const generatedAt = now.toISOString();
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

console.error(`Tracker refresh ${generatedAt} (token ${token ? "present" : "absent"})`);

const models = await fetchModels();
const papers = await fetchPapers();
const linkedPapers = linkPapersToModels(papers, models);

// Thresholds are deliberately low: a quiet week is fine, an empty one means
// something broke upstream.
const modelProblems = validateTrackerItems(models, minimumItems(10, modelLimit), (model) => model.id);
const paperProblems = validateTrackerItems(linkedPapers, minimumItems(10, paperLimit), (paper) => paper.arxivId);
if (modelProblems.length || paperProblems.length) {
  console.error(`Refusing to write tracker files; previous data kept.`);
  for (const problem of modelProblems) console.error(`  models: ${problem}`);
  for (const problem of paperProblems) console.error(`  papers: ${problem}`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
await writeFilesTogether(
  [
    trackerFile<TrackedModel>("models.json", "https://huggingface.co/api/models (trending, per pipeline)", modelDays, models),
    trackerFile<TrackedPaper>("papers.json", "https://huggingface.co/api/daily_papers", paperDays, linkedPapers),
  ],
  { writeFile: (file, data) => writeFile(file, data), rename, rm },
  String(process.pid),
);
console.error(`  wrote models.json and papers.json in ${outDir}`);

const newestModel = models.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
const newestPaper = linkedPapers.reduce((a, b) => (a.publishedAt > b.publishedAt ? a : b));
console.log(`models: ${models.length} (newest ${newestModel.id} ${newestModel.createdAt.slice(0, 10)})`);
console.log(`papers: ${linkedPapers.length} (newest ${newestPaper.arxivId} ${newestPaper.publishedAt.slice(0, 10)}, ${linkedPapers.filter((p) => p.linkedModelIds.length).length} with linked models)`);


async function fetchModels() {
  const expand = ["author", "createdAt", "likes", "downloads", "trendingScore", "pipeline_tag", "tags", "safetensors", "cardData", "gated", "private"];
  const lists: TrackedModel[][] = [];
  for (const pipeline of TRACKED_PIPELINES) {
    const url = new URL(`${hubBase}/api/models`);
    url.searchParams.set("sort", "trendingScore");
    url.searchParams.set("direction", "-1");
    url.searchParams.set("limit", "100");
    url.searchParams.set("pipeline_tag", pipeline);
    for (const field of expand) url.searchParams.append("expand[]", field);
    const rows = (await (await fetchWithRetry(url)).json()) as HfModelRow[];
    if (!Array.isArray(rows)) throw new Error(`Unexpected models response for ${pipeline}`);
    const kept = rows.map((row) => toTrackedModel(row, now, modelDays)).filter((m): m is TrackedModel => m !== null);
    console.error(`  ${pipeline}: ${rows.length} trending, ${kept.length} new originals or fine-tunes`);
    lists.push(kept);
  }
  return mergeModels(lists, modelLimit);
}

async function fetchPapers() {
  const start = windowStart(now, paperDays);
  const collected: TrackedPaper[] = [];
  // One request per day keeps each response small and lets a single bad day
  // fail loudly instead of silently truncating a month.
  for (let cursor = new Date(start); cursor <= now; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const url = new URL(`${hubBase}/api/daily_papers`);
    url.searchParams.set("date", isoDay(cursor));
    url.searchParams.set("limit", "100");
    const rows = (await (await fetchWithRetry(url)).json()) as Array<Parameters<typeof toTrackedPaper>[0]>;
    if (!Array.isArray(rows)) throw new Error(`Unexpected daily_papers response for ${isoDay(cursor)}`);
    for (const row of rows) {
      const paper = toTrackedPaper(row, start, now);
      if (paper) collected.push(paper);
    }
  }
  console.error(`  daily papers: ${collected.length} rows over ${paperDays} days`);
  return mergePapers(collected, paperLimit);
}

// Builds one file's contents; writeFilesTogether stages and swaps the pair so
// a reader never sees half a JSON file or a half-finished run.
function trackerFile<T>(name: string, source: string, days: number, items: T[]) {
  const file: TrackerFile<T> = {
    schemaVersion: TRACKER_SCHEMA_VERSION,
    generatedAt,
    window: { start: isoDay(windowStart(now, days)), end: isoDay(now), days },
    source,
    count: items.length,
    items,
  };
  return { target: path.join(outDir, name), content: `${JSON.stringify(file, null, 2)}\n` };
}

async function fetchWithRetry(url: URL) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "1kpapers-tracker/0.1",
          ...authHeaders(url, token),
        },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok) return response;
      // Strip the query so a token-bearing URL could never land in a log; the
      // token is in a header anyway, this is belt and braces.
      lastError = new Error(`${response.status} ${response.statusText} for ${url.origin}${url.pathname}`);
      if (response.status !== 429 && response.status < 500) throw lastError;
    } catch (error) {
      lastError = error;
      if (error instanceof Error && /^4\d\d /.test(error.message) && !error.message.startsWith("429")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000 * 2 ** attempt));
  }
  throw lastError;
}

function positiveInt(value: string, name: string) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) throw new Error(`--${name} must be a positive integer, got ${value}`);
  return number;
}
