import { readFile, writeFile } from "node:fs/promises";
import type { BenchmarkRow } from "./types.js";

const results = JSON.parse(
  await readFile("results/latest.json", "utf8"),
) as { generatedAt: string; rows: BenchmarkRow[] };
const ok = results.rows.filter((row) => row.status === "ok");
const models = [
  ...new Map(results.rows.map((row) => [row.model.id, row.model])).values(),
];
const factFixtures = JSON.parse(
  await readFile(new URL("../facts.json", import.meta.url), "utf8"),
) as Record<string, string[][]>;

const lines = [
  "# SmartPDFs summarization benchmark",
  "",
  `Generated: ${results.generatedAt}`,
  "",
  "Costs are language-model inference only. PDFs are downloaded and text is extracted locally; storage, networking, and observability are excluded.",
  "",
  "## Results by PDF",
  "",
  `| PDF | Pages | ${models.map((model) => `${model.label} cost / time / facts`).join(" | ")} |`,
  `| --- | ---: | ${models.map(() => "---:").join(" | ")} |`,
];

for (const source of [...new Set(results.rows.map((row) => row.source.id))]) {
  const sourceRows = results.rows.filter((row) => row.source.id === source);
  const first = sourceRows[0]!;
  lines.push(
    `| [${first.source.title}](${first.source.landingPage}) | ${first.source.pages} | ${models
      .map((model) => {
        const row = sourceRows.find((candidate) => candidate.model.id === model.id);
        if (!row) return "—";
        if (row.status !== "ok") {
          return `failed / ${(row.totalLatencyMs / 1000).toFixed(1)}s / —`;
        }
        return `$${row.totalCostUsd.toFixed(6)} / ${(row.totalLatencyMs / 1000).toFixed(1)}s / ${Math.round(factualCoverage(row) * 100)}%`;
      })
      .join(" | ")} |`,
  );
}

lines.push("", "## Model totals", "", "| Model | Completed | Input tokens | Output tokens | Successful-run cost | Median PDF cost | Median time | Median facts | Under 30s |", "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
for (const model of models) {
  const rows = ok.filter((row) => row.model.id === model.id);
  const attempted = results.rows.filter((row) => row.model.id === model.id);
  lines.push(
    `| ${model.label} | ${rows.length}/${attempted.length} | ${sum(rows, "totalInputTokens").toLocaleString("en-US")} | ${sum(rows, "totalOutputTokens").toLocaleString("en-US")} | $${sum(rows, "totalCostUsd").toFixed(6)} | $${median(rows.map((row) => row.totalCostUsd)).toFixed(6)} | ${(median(rows.map((row) => row.totalLatencyMs)) / 1000).toFixed(1)}s | ${Math.round(median(rows.map(factualCoverage)) * 100)}% | ${rows.filter((row) => row.withinThirtySeconds).length}/${rows.length} |`,
  );
}

const failed = results.rows.filter((row) => row.status === "failed");
lines.push("", "## Failures", "", "| Model | PDF | Elapsed | Measured partial cost | Error |", "| --- | --- | ---: | ---: | --- |");
for (const row of failed) {
  lines.push(
    `| ${row.model.label} | ${row.source.title} | ${(row.totalLatencyMs / 1000).toFixed(1)}s | $${row.totalCostUsd.toFixed(6)} | ${escapeCell(row.error ?? "unknown error")} |`,
  );
}

lines.push(
  "",
  "## Method",
  "",
  "- Uses the same PDF.js extraction, four-or-more chunks (50,000-character maximum), prompt, chunk fan-out, and final reduce pass as Nutlope/SmartPDFs PR #8. Chunk calls allow 1,600 output tokens; the stricter final reduce allows 1,000.",
  "- Extended reasoning is disabled. Each model sees the same extracted text and English prompt.",
  "- Token counts come from each provider response. Prices are the configured standard API prices per one million tokens; cached-input discounts are not assumed.",
  "- The main matrix used a 60-second per-call harness timeout; the Kimi representative run used 120 seconds. `Under 30s` is end-to-end wall time, while SmartPDFs enforces its 30-second limit on each individual route call.",
  "- PDFs and full model outputs are gitignored. This report, source URLs, hashes, document sizes, aggregate usage, cost, and latency are publishable.",
  "",
);

await writeFile("RESULTS.md", `${lines.join("\n")}\n`);
console.log("Wrote RESULTS.md");

function sum(rows: BenchmarkRow[], key: "totalInputTokens" | "totalOutputTokens" | "totalCostUsd") {
  return rows.reduce((total, row) => total + row[key], 0);
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

function factualCoverage(row: BenchmarkRow) {
  const groups = factFixtures[row.source.id] ?? [];
  if (!groups.length || !row.finalSummary) return 0;
  const summary = `${row.finalTitle ?? ""} ${row.finalSummary}`.toLocaleLowerCase();
  return (
    groups.filter((alternatives) =>
      alternatives.some((fact) => summary.includes(fact.toLocaleLowerCase())),
    ).length / groups.length
  );
}

function escapeCell(value: string) {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}
