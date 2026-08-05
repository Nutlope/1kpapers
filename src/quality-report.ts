import { readFile, writeFile } from "node:fs/promises";
import { prepareDocument } from "./pdf.js";
import type { BenchmarkRow } from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
if (!args.input || !args.judgments) {
  throw new Error("Usage: pnpm quality -- --input=<benchmark.json> --judgments=<judge.json,...>");
}
const benchmark = JSON.parse(await readFile(args.input, "utf8")) as {
  rows: BenchmarkRow[];
};
const judgments = (
  await Promise.all(
    args.judgments.split(",").map(async (file: string) => {
      const result = JSON.parse(await readFile(file, "utf8")) as {
        judgments: Judgment[];
      };
      return result.judgments;
    }),
  )
).flat();
const calibration = args.calibration
  ? (JSON.parse(await readFile(args.calibration, "utf8")) as {
      reviewStatus: string;
    }[])
  : [];
const modelLabels = new Map(
  benchmark.rows.map((row) => [row.model.id, row.model.label]),
);
const sourceTexts = new Map<string, string>();
for (const row of benchmark.rows) {
  if (!sourceTexts.has(row.source.id)) {
    const document = await prepareDocument(row.source);
    sourceTexts.set(row.source.id, document.chunks.join(""));
  }
}

const lines = [
  "# Pilot quality report",
  "",
  "Quality, reliability, latency, summarization cost, and judge cost are separate axes.",
  "",
  "## Quality by summarizer",
  "",
  "| Summarizer | Kimi K3 mean | GLM 5.2 mean | Kimi judgments | GLM judgments | Numbers found in source | Final format pass |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
];
for (const modelId of new Set(benchmark.rows.map((row) => row.model.id))) {
  const modelRows = benchmark.rows.filter((row) => row.model.id === modelId);
  const modelJudgments = judgments.filter(
    (judgment) => judgment.candidateModelId === modelId && judgment.status === "ok",
  );
  const kimi = modelJudgments.filter((judgment) => judgment.judge.key === "kimi-k3");
  const glm = modelJudgments.filter((judgment) => judgment.judge.key === "glm-5.2");
  const checks = modelRows
    .filter((row) => row.status === "ok" && row.finalSummary)
    .map((row) => deterministicChecks(row, sourceTexts.get(row.source.id)!));
  lines.push(
    `| ${modelLabels.get(modelId)} | ${meanScore(kimi)} | ${meanScore(glm)} | ${kimi.length} | ${glm.length} | ${ratio(checks.reduce((sum, check) => sum + check.matchedNumbers, 0), checks.reduce((sum, check) => sum + check.totalNumbers, 0))} | ${ratio(checks.filter((check) => check.formatPass).length, checks.length)} |`,
  );
}

const paired = pairedJudgments(judgments);
const disagreements = paired.filter((pair) => pair.difference >= 20);
lines.push(
  "",
  "## Judge agreement",
  "",
  `- Paired judgments: ${paired.length}`,
  `- Mean absolute score difference: ${mean(paired.map((pair) => pair.difference)).toFixed(2)}`,
  `- Within 10 points: ${ratio(paired.filter((pair) => pair.difference <= 10).length, paired.length)}`,
  `- Disagreements of 20+ points requiring human review: ${disagreements.length}`,
  "",
  "## Judge cost and reliability",
  "",
  "| Judge | Completed | Failed | Context skips | Input tokens | Output tokens | Reasoning tokens | Cost |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
);
for (const judgeKey of new Set(judgments.map((judgment) => judgment.judge.key))) {
  const rows = judgments.filter((judgment) => judgment.judge.key === judgeKey);
  const completed = rows.filter((judgment) => judgment.status === "ok");
  const failed = rows.filter((judgment) => judgment.status === "failed");
  const skipped = rows.filter((judgment) => judgment.status === "skipped");
  lines.push(
    `| ${rows[0]?.judge.label} | ${completed.length} | ${failed.length} | ${skipped.length} | ${sum(completed, (row) => row.usage.inputTokens).toLocaleString("en-US")} | ${sum(completed, (row) => row.usage.outputTokens).toLocaleString("en-US")} | ${sum(completed, (row) => row.usage.reasoningTokens).toLocaleString("en-US")} | $${sum(completed, (row) => row.costUsd).toFixed(4)} |`,
  );
}

const reviewed = calibration.filter((item) => item.reviewStatus === "human-reviewed").length;
lines.push(
  "",
  "## Human calibration gate",
  "",
  `- Human-reviewed checklists: ${reviewed}/${calibration.length}`,
  `- Gate: ${reviewed === 15 ? "passed" : "not passed"}`,
  "",
  "The full-corpus benchmark must not be described as human-calibrated until all 15 checklists are completed and the 20-point judge disagreements are resolved.",
  "",
  "## Deterministic checks",
  "",
  "`Numbers found in source` is an exact normalized-text check, not a semantic factuality score. It detects unsupported numerical strings but cannot determine whether a supported number is used in the correct context. `Final format pass` verifies the published 3,000-character ceiling and required paragraph/list HTML structure.",
  "",
);
await writeFile(args.output ?? "PILOT_QUALITY.md", `${lines.join("\n")}\n`);
console.log(`Wrote ${args.output ?? "PILOT_QUALITY.md"}`);

function deterministicChecks(row: BenchmarkRow, source: string) {
  const summary = `${row.finalTitle ?? ""} ${stripHtml(row.finalSummary ?? "")}`;
  const sourceNumbers = new Set(extractNumbers(source));
  const summaryNumbers = extractNumbers(summary);
  return {
    totalNumbers: summaryNumbers.length,
    matchedNumbers: summaryNumbers.filter((number) => sourceNumbers.has(number)).length,
    formatPass:
      (row.finalSummary?.length ?? Infinity) <= 3_000 &&
      /^<p>[\s\S]*<\/p>\s*<ul>[\s\S]*<\/ul>$/.test(row.finalSummary?.trim() ?? ""),
  };
}

function extractNumbers(value: string) {
  return [...value.matchAll(/(?<![\w.])[+-]?\d[\d,.]*(?:%|×|x)?/gi)].map((match) =>
    match[0].toLowerCase().replaceAll(",", ""),
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function pairedJudgments(rows: Judgment[]) {
  const groups = Object.values(
    Object.groupBy(
      rows.filter((row) => row.status === "ok"),
      (row) => `${row.sourceId}\u0000${row.opaqueCandidateId}`,
    ),
  );
  return groups.flatMap((group) => {
    const kimi = group?.find((row) => row.judge.key === "kimi-k3");
    const glm = group?.find((row) => row.judge.key === "glm-5.2");
    return kimi?.totalScore != null && glm?.totalScore != null
      ? [{ kimi, glm, difference: Math.abs(kimi.totalScore - glm.totalScore) }]
      : [];
  });
}

function meanScore(rows: Judgment[]) {
  return rows.length ? mean(rows.map((row) => row.totalScore!)).toFixed(2) : "—";
}

function mean(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function ratio(numerator: number, denominator: number) {
  return denominator ? `${numerator}/${denominator} (${((numerator / denominator) * 100).toFixed(1)}%)` : "—";
}

function sum<T>(rows: T[], select: (row: T) => number) {
  return rows.reduce((total, row) => total + select(row), 0);
}

type Judgment = {
  status: "ok" | "failed" | "skipped";
  judge: { key: string; label: string };
  sourceId: string;
  opaqueCandidateId: string;
  candidateModelId: string;
  totalScore: number | null;
  usage: { inputTokens: number; outputTokens: number; reasoningTokens: number };
  costUsd: number;
};
