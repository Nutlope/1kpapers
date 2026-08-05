import { readFile, writeFile } from "node:fs/promises";
import type { BenchmarkRow } from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const inputPath = args.input ?? "results/latest.json";
const outputPath = args.output ?? "RESULTS.md";
const title = args.title ?? "Paper summarization benchmark";
const results = JSON.parse(await readFile(inputPath, "utf8")) as {
  generatedAt: string;
  methodologyVersion: number;
  runId?: string;
  rows: BenchmarkRow[];
};
const models = [
  ...new Map(results.rows.map((row) => [row.model.id, row.model])).values(),
];

const lines = [
  `# ${title}`,
  "",
  `Generated: ${results.generatedAt}`,
  "",
  `Run: \`${results.runId ?? "legacy"}\`; methodology version: ${results.methodologyVersion}.`,
  "",
  "Costs are standard synchronous language-model inference only. PDFs are downloaded and text is extracted locally; judge inference, storage, networking, and observability are excluded.",
  "",
  "## Model totals",
  "",
  "| Model | Completed | Cost | Cost / attempted paper | Input tokens | Output tokens | p50 latency | p95 latency | Retries | Trimmed finals | Failures |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
];

for (const model of models) {
  const attempted = results.rows.filter((row) => row.model.id === model.id);
  const completed = attempted.filter((row) => row.status === "ok");
  const latencies = completed.map((row) => row.totalLatencyMs);
  lines.push(
    `| ${model.label} | ${completed.length}/${attempted.length} (${percent(completed.length, attempted.length)}) | $${sum(attempted, "totalCostUsd").toFixed(6)} | $${(sum(attempted, "totalCostUsd") / Math.max(1, attempted.length)).toFixed(6)} | ${sum(attempted, "totalInputTokens").toLocaleString("en-US")} | ${sum(attempted, "totalOutputTokens").toLocaleString("en-US")} | ${seconds(percentile(latencies, 0.5))} | ${seconds(percentile(latencies, 0.95))} | ${retryCount(attempted)} | ${normalizationCount(attempted)} | ${attempted.length - completed.length} |`,
  );
}

const failures = results.rows.filter((row) => row.status === "failed");
lines.push(
  "",
  "## Failure categories",
  "",
  "| Category | Count |",
  "| --- | ---: |",
);
const categories = Object.entries(Object.groupBy(failures, (row) => categorize(row.error)));
if (!categories.length) lines.push("| None | 0 |");
for (const [category, rows] of categories) lines.push(`| ${category} | ${rows?.length ?? 0} |`);

if (args.details === "true") {
  lines.push(
    "",
    "## Per-paper results",
    "",
    "| Model | Paper | Status | Cost | Latency | Requests | Retries | Error |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
  );
  for (const row of results.rows) {
    lines.push(
      `| ${row.model.label} | [${escapeCell(row.source.title)}](${row.source.landingPage}) | ${row.status} | $${row.totalCostUsd.toFixed(6)} | ${seconds(row.totalLatencyMs)} | ${row.requests.length} | ${retryCount([row])} | ${escapeCell(row.error ?? "—")} |`,
    );
  }
}

lines.push(
  "",
  "## Method",
  "",
  "- Every model receives the same locally extracted text, chunk boundaries, prompt, and final reduce pass.",
  "- Extended reasoning is disabled. Provider-reported token usage and the frozen standard synchronous price produce each cost.",
  "- Transient timeouts, rate limits, and server errors are retried with bounded exponential backoff; retry counts remain visible.",
  "- Completion rate, quality, cost, and latency are separate axes. Judge scores and judge cost are reported separately.",
  "",
);

await writeFile(outputPath, `${lines.join("\n")}\n`);
console.log(`Wrote ${outputPath}`);

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

function retryCount(rows: BenchmarkRow[]) {
  return rows.reduce(
    (total, row) =>
      total +
      row.requests.reduce(
        (requestTotal, request) =>
          requestTotal + Math.max(0, (request.attempts ?? 1) - 1),
        0,
      ),
    0,
  );
}

function normalizationCount(rows: BenchmarkRow[]) {
  return rows.filter((row) => row.requests.at(-1)?.normalized === true).length;
}

function categorize(error: string | null) {
  const value = error?.toLowerCase() ?? "";
  if (value.includes("timeout") || value.includes("timed out")) return "timeout";
  if (value.includes("429") || value.includes("rate limit")) return "rate limit";
  if (value.includes("schema") || value.includes("json")) return "malformed output";
  if (/\(5\d\d\)/.test(value)) return "provider server error";
  return "other";
}

function percent(numerator: number, denominator: number) {
  return denominator ? `${((numerator / denominator) * 100).toFixed(1)}%` : "0.0%";
}

function seconds(milliseconds: number) {
  return `${(milliseconds / 1_000).toFixed(1)}s`;
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}
