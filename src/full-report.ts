import { readFile, writeFile } from "node:fs/promises";
import type { BenchmarkRow } from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...parts] = arg.replace(/^--/, "").split("=");
    return [key, parts.length ? parts.join("=") : "true"];
  }),
) as Record<string, string>;
const inputPaths = (args.inputs ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (!inputPaths.length) {
  throw new Error(
    "Usage: pnpm full-report -- --inputs=<result.json,result.json,...>",
  );
}

const outputPath = args.output ?? "FULL-RESULTS.md";
const jsonPath = args.json ?? "results/full-results.json";
const profilePath = args.profile ?? "corpus/full-1000-profile.json";
const corpusPath = args.corpus ?? "corpus/papers.json";
const allowIncomplete = args["allow-incomplete"] === "true";

type ResultFile = {
  runId?: string;
  methodologyVersion?: number;
  runConfig?: { mainBodyOnly?: boolean };
  rows: BenchmarkRow[];
};
type CorpusPaper = {
  arxivId: string;
  title: string;
  officialLab: string | null;
  topicTags: string[];
};
type ProfilePaper = {
  id: string;
  title: string;
  pages: number;
  characters: number;
};

const resultFiles = await Promise.all(
  inputPaths.map(async (inputPath) => ({
    inputPath,
    result: JSON.parse(await readFile(inputPath, "utf8")) as ResultFile,
  })),
);
const attempts = resultFiles.flatMap(({ inputPath, result }) =>
  result.rows.map((row) => ({ inputPath, row })),
);
const mainBodyFallbacks = resultFiles.flatMap(({ result }) =>
  result.runConfig?.mainBodyOnly
    ? result.rows.filter((row) => row.status === "ok")
    : [],
);
const profile = JSON.parse(
  await readFile(profilePath, "utf8"),
) as ProfilePaper[];
const corpus = JSON.parse(await readFile(corpusPath, "utf8")) as {
  papers: CorpusPaper[];
};

const canonical = new Map<string, BenchmarkRow>();
for (const { row } of attempts) {
  const key = `${row.model.id}\0${row.source.id}`;
  const existing = canonical.get(key);
  if (!existing || (existing.status !== "ok" && row.status === "ok")) {
    canonical.set(key, row);
  }
}
const canonicalRows = [...canonical.values()];
const models = [
  ...new Map(canonicalRows.map((row) => [row.model.id, row.model])).values(),
];
const profileById = new Map(profile.map((paper) => [paper.id, paper]));

const modelStats = models.map((model) => {
  const modelCanonical = canonicalRows.filter(
    (row) => row.model.id === model.id,
  );
  const completed = modelCanonical.filter((row) => row.status === "ok");
  const unresolved = modelCanonical.filter((row) => row.status !== "ok");
  const latencies = completed
    .map((row) => row.totalLatencyMs)
    .filter((latencyMs) => latencyMs > 0);
  const summaryWords = completed.map((row) => wordCount(row.finalSummary ?? ""));
  const completedSummaryCostUsd = sum(completed, "totalCostUsd");
  return {
    model,
    covered: modelCanonical.length,
    completed: completed.length,
    unresolved: unresolved.length,
    completedSummaryCostUsd,
    costPerCompletedUsd:
      completedSummaryCostUsd / Math.max(1, completed.length),
    inputTokens: sum(completed, "totalInputTokens"),
    outputTokens: sum(completed, "totalOutputTokens"),
    normalizedFinals: completed.filter(
      (row) => row.requests.at(-1)?.normalized === true,
    ).length,
    latencySamples: latencies.length,
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    p50SummaryWords: percentile(summaryWords, 0.5),
    p95SummaryWords: percentile(summaryWords, 0.95),
    unresolvedRows: unresolved,
  };
});
const incompleteModels = modelStats.filter(
  (stats) => stats.completed !== profile.length || stats.unresolved !== 0,
);
if (incompleteModels.length && !allowIncomplete) {
  throw new Error(
    `Refusing to publish an incomplete report: ${incompleteModels
      .map(
        (stats) =>
          `${stats.model.label} ${stats.completed}/${profile.length} completed, ${stats.unresolved} unresolved`,
      )
      .join("; ")}. Pass --allow-incomplete=true only for a local preview.`,
  );
}
const cheapestCost = Math.min(
  ...modelStats.map((stats) => stats.completedSummaryCostUsd),
);

const pages = profile.map((paper) => paper.pages);
const characters = profile.map((paper) => paper.characters);
const labs = countBy(
  corpus.papers.filter((paper) => paper.officialLab),
  (paper) => paper.officialLab!,
);
const topics = countMany(corpus.papers, (paper) => paper.topicTags);

const mostExpensive = canonicalRows
  .filter((row) => row.status === "ok")
  .sort((a, b) => b.totalCostUsd - a.totalCostUsd)
  .slice(0, 15)
  .map((row) => ({
    model: row.model.label,
    paper: row.source.title,
    pages: profileById.get(row.source.id)?.pages ?? row.source.pages,
    costUsd: row.totalCostUsd,
    latencyMs: row.totalLatencyMs,
  }));

const generatedAt = new Date().toISOString();
const aggregate = {
  generatedAt,
  scope: "completed-summary-cost-corpus-and-operational-statistics-without-judges",
  selectionPolicy:
    "One completed result per model and paper; failed and superseded runs excluded.",
  corpus: {
    papers: profile.length,
    pages: pages.reduce((total, value) => total + value, 0),
    characters: characters.reduce((total, value) => total + value, 0),
    medianPages: percentile(pages, 0.5),
    p95Pages: percentile(pages, 0.95),
    maxPages: Math.max(...pages),
    medianCharacters: percentile(characters, 0.5),
    p95Characters: percentile(characters, 0.95),
    maxCharacters: Math.max(...characters),
    officialLabs: Object.fromEntries(sortedCounts(labs)),
    topics: Object.fromEntries(sortedCounts(topics)),
  },
  models: modelStats.map(({ model, unresolvedRows, ...stats }) => ({
    id: model.id,
    label: model.label,
    ...stats,
    unresolvedSourceIds: unresolvedRows.map((row) => row.source.id),
  })),
  mostExpensive,
};

const lines = [
  "# Summarizing 1,000 AI papers",
  "",
  `Generated: ${generatedAt}`,
  "",
  "This is a corpus-scale cost and operational-statistics report. Judges were intentionally removed, so these results do not rank factual accuracy or summary quality.",
  "",
  "## Model totals",
  "",
  "Cost counts exactly one completed result per model and paper. Failed and superseded runs are excluded for every model.",
  "",
  "| Model | Completed | Completed-summary inference cost | Cost / completed paper | Relative cost | Input tokens | Output tokens | p50 latency | p95 latency | Latency samples |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
];
for (const stats of modelStats) {
  lines.push(
    `| ${stats.model.label} | ${stats.completed}/${stats.covered} | $${stats.completedSummaryCostUsd.toFixed(6)} | $${stats.costPerCompletedUsd.toFixed(6)} | ${(stats.completedSummaryCostUsd / cheapestCost).toFixed(2)}x | ${formatInteger(stats.inputTokens)} | ${formatInteger(stats.outputTokens)} | ${seconds(stats.p50LatencyMs)} | ${seconds(stats.p95LatencyMs)} | ${formatInteger(stats.latencySamples)} |`,
  );
}

lines.push(
  "",
  "Per-paper latency is measured only for synchronous requests inside concurrent runs; batch rows have no fabricated latency and are excluded from these percentiles. This is not the time a sequential 1,000-paper job would take.",
  "",
  "## Corpus summarized",
  "",
  `- ${formatInteger(aggregate.corpus.papers)} public papers`,
  `- ${formatInteger(aggregate.corpus.pages)} PDF pages`,
  `- ${formatInteger(aggregate.corpus.characters)} extracted characters`,
  `- Paper length: median ${formatInteger(aggregate.corpus.medianPages)} pages, p95 ${formatInteger(aggregate.corpus.p95Pages)} pages, maximum ${formatInteger(aggregate.corpus.maxPages)} pages`,
  `- Extracted text: median ${formatInteger(aggregate.corpus.medianCharacters)} characters, p95 ${formatInteger(aggregate.corpus.p95Characters)}, maximum ${formatInteger(aggregate.corpus.maxCharacters)}`,
  "",
  "### Guaranteed official-lab papers",
  "",
  "| Lab | Papers |",
  "| --- | ---: |",
);
for (const [lab, count] of sortedCounts(labs)) {
  lines.push(`| ${escapeCell(lab)} | ${count} |`);
}

lines.push(
  "",
  "### Non-exclusive topics",
  "",
  "| Topic | Papers |",
  "| --- | ---: |",
);
for (const [topic, count] of sortedCounts(topics)) {
  lines.push(`| ${escapeCell(topic)} | ${count} |`);
}

lines.push(
  "",
  "## Summary output",
  "",
  "| Model | p50 summary words | p95 summary words | Deterministically trimmed finals |",
  "| --- | ---: | ---: | ---: |",
);
for (const stats of modelStats) {
  lines.push(
    `| ${stats.model.label} | ${formatInteger(stats.p50SummaryWords)} | ${formatInteger(stats.p95SummaryWords)} | ${formatInteger(stats.normalizedFinals)} |`,
  );
}

lines.push(
  "",
  "## Most expensive completed summaries",
  "",
  "| Model | Paper | Pages | Cost | Latency |",
  "| --- | --- | ---: | ---: | ---: |",
);
for (const row of mostExpensive) {
  lines.push(
    `| ${row.model} | ${escapeCell(row.paper)} | ${formatInteger(row.pages)} | $${row.costUsd.toFixed(6)} | ${seconds(row.latencyMs)} |`,
  );
}

const unresolved = modelStats.flatMap((stats) =>
  stats.unresolvedRows.map((row) => ({ model: stats.model.label, row })),
);
lines.push(
  "",
  "## Unresolved failures",
  "",
  "| Model | Paper | Error |",
  "| --- | --- | --- |",
);
if (!unresolved.length) lines.push("| None | n/a | n/a |");
for (const { model, row } of unresolved) {
  lines.push(
    `| ${model} | ${escapeCell(row.source.title)} | ${escapeCell(row.error ?? "unknown")} |`,
  );
}

lines.push(
  "",
  "## Method",
  "",
  "- The complete locally extracted PDF text is sent in one request when it fits a conservative half-context character budget.",
  "- Oversized inputs use the same 50,000-character map/reduce fallback instead of truncating source text.",
  ...(mainBodyFallbacks.length
    ? [
        `- ${mainBodyFallbacks.length} provider-filtered paper used an explicit main-body-only fallback ending before the References section; its appendices and references were excluded.`,
      ]
    : []),
  "- Models receive the same final-summary prompt and restricted Markdown contract; extended reasoning is disabled.",
  "- Costs count one completed result per model and paper. Failed and superseded runs are excluded.",
  "- Costs use provider-reported token usage and the frozen standard synchronous prices in the repository.",
  "- PDF download, local extraction, storage, networking, judge inference, and developer time are excluded.",
  "- This report supports cost, scale, and operational comparisons only; it does not establish factual accuracy.",
  "",
);

await writeFile(outputPath, `${lines.join("\n")}\n`);
await writeFile(jsonPath, `${JSON.stringify(aggregate, null, 2)}\n`);
console.log(`Wrote ${outputPath} and ${jsonPath}`);

function sum(
  rows: BenchmarkRow[],
  key: "totalInputTokens" | "totalOutputTokens" | "totalCostUsd",
) {
  return rows.reduce((total, row) => total + row[key], 0);
}

function percentile(values: number[], quantile: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(quantile * sorted.length) - 1] ?? 0;
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function countBy<T>(values: T[], key: (value: T) => string) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const name = key(value);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

function countMany<T>(values: T[], keys: (value: T) => string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    for (const name of keys(value)) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return counts;
}

function sortedCounts(counts: Map<string, number>) {
  return [...counts.entries()].sort(
    ([leftName, left], [rightName, right]) =>
      right - left || leftName.localeCompare(rightName),
  );
}

function formatInteger(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function seconds(milliseconds: number) {
  if (!milliseconds) return "n/a";
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}
