import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { MODELS, calculateCost } from "./models.js";
import { prepareDocument } from "./pdf.js";
import { summarize } from "./providers.js";
import type {
  BenchmarkRow,
  ModelConfig,
  RequestResult,
  Source,
} from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const selectedModelIds = args.models?.split(",").filter(Boolean);
const selectedSourceIds = args.sources?.split(",").filter(Boolean);
const models = selectedModelIds
  ? MODELS.filter((model) => selectedModelIds.includes(model.id))
  : MODELS;
const sourceFile = path.resolve(args["source-file"] ?? "sources.json");
const allSources = JSON.parse(await readFile(sourceFile, "utf8")) as Source[];
const sources = selectedSourceIds
  ? allSources.filter((source) => selectedSourceIds.includes(source.id))
  : allSources;

if (!models.length || !sources.length) {
  throw new Error("No models or sources matched the supplied filters");
}

const documents = [];
for (const source of sources) documents.push(await prepareDocument(source));

const rows: BenchmarkRow[] = [];
for (const model of models) {
  const keyName = `${model.provider.toUpperCase()}_API_KEY`;
  if (!process.env[keyName]) {
    for (const document of documents) {
      rows.push(skippedRow(document, model, `Missing ${keyName}`));
      await writeCheckpoint(rows);
    }
    continue;
  }
  for (const document of documents) {
    console.error(`Running ${model.label} on ${document.title} (${document.chunks.length} chunks)`);
    rows.push(await runDocument(model, document));
    await writeCheckpoint(rows);
  }
}

const generatedAt = new Date().toISOString();
const result = { generatedAt, methodologyVersion: 1, rows };
await mkdir("results/raw", { recursive: true });
const stamp = generatedAt.replaceAll(":", "-");
await writeFile(`results/raw/${stamp}.json`, JSON.stringify(result, null, 2));
await writeFile("results/latest.json", JSON.stringify(result, null, 2));
if (args.json === "true") {
  console.log(JSON.stringify(result, null, 2));
} else {
  for (const row of rows) {
    console.log(
      `${row.model.label}\t${row.source.id}\t${row.status}\t$${row.totalCostUsd.toFixed(6)}\t${(row.totalLatencyMs / 1_000).toFixed(1)}s${row.error ? `\t${row.error}` : ""}`,
    );
  }
  console.log(`Saved results/latest.json and results/raw/${stamp}.json`);
}

async function runDocument(
  model: ModelConfig,
  document: Awaited<ReturnType<typeof prepareDocument>>,
): Promise<BenchmarkRow> {
  const started = performance.now();
  let completedRequests: RequestResult[] = [];
  try {
    const settledChunks = await Promise.allSettled(
      document.chunks.map(async (text, chunkIndex) => {
        const inference = await summarize(model, text, "chunk");
        return toRequest(model, inference, "chunk", chunkIndex);
      }),
    );
    const chunkOutputs = settledChunks
      .filter(
        (result): result is PromiseFulfilledResult<RequestResult> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);
    const chunkErrors = settledChunks
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      )
      .map((result) =>
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason),
      );
    if (chunkErrors.length) {
      return failedRow(
        document,
        model,
        chunkOutputs,
        performance.now() - started,
        `${chunkErrors.length}/${document.chunks.length} chunk requests failed: ${chunkErrors.join("; ")}`,
      );
    }
    completedRequests = chunkOutputs;
    const reduceInput = chunkOutputs.map((row) => row.summary).join("\n\n");
    const final = await summarize(model, reduceInput, "reduce");
    const reduceOutput = toRequest(model, final, "reduce", null);
    const requests = [...chunkOutputs, reduceOutput];
    return completeRow(document, model, requests, performance.now() - started);
  } catch (error) {
    return failedRow(
      document,
      model,
      completedRequests,
      performance.now() - started,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function failedRow(
  document: Awaited<ReturnType<typeof prepareDocument>>,
  model: ModelConfig,
  requests: RequestResult[],
  totalLatencyMs: number,
  error: string,
): BenchmarkRow {
  return {
    ...baseRow(document, model),
    status: "failed",
    requests,
    totalInputTokens: sum(requests, (row) => row.usage.inputTokens),
    totalOutputTokens: sum(requests, (row) => row.usage.outputTokens),
    totalCostUsd: sum(requests, (row) => row.costUsd),
    totalLatencyMs: Math.round(totalLatencyMs),
    withinThirtySeconds: false,
    finalTitle: null,
    finalSummary: null,
    error,
  };
}

function toRequest(
  model: ModelConfig,
  inference: Awaited<ReturnType<typeof summarize>>,
  stage: RequestResult["stage"],
  chunkIndex: number | null,
): RequestResult {
  return {
    ...inference,
    stage,
    chunkIndex,
    costUsd: calculateCost(
      model,
      inference.usage.inputTokens,
      inference.usage.outputTokens,
    ),
  };
}

function completeRow(
  document: Awaited<ReturnType<typeof prepareDocument>>,
  model: ModelConfig,
  requests: RequestResult[],
  totalLatencyMs: number,
): BenchmarkRow {
  const final = requests.at(-1)!;
  return {
    ...baseRow(document, model),
    status: "ok",
    requests,
    totalInputTokens: sum(requests, (row) => row.usage.inputTokens),
    totalOutputTokens: sum(requests, (row) => row.usage.outputTokens),
    totalCostUsd: sum(requests, (row) => row.costUsd),
    totalLatencyMs: Math.round(totalLatencyMs),
    withinThirtySeconds:
      totalLatencyMs <= 30_000 && requests.every((row) => row.latencyMs <= 30_000),
    finalTitle: final.title,
    finalSummary: final.summary,
    error: null,
  };
}

function skippedRow(
  document: Awaited<ReturnType<typeof prepareDocument>>,
  model: ModelConfig,
  error: string,
): BenchmarkRow {
  return {
    ...baseRow(document, model),
    status: "skipped",
    requests: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCostUsd: 0,
    totalLatencyMs: 0,
    withinThirtySeconds: false,
    finalTitle: null,
    finalSummary: null,
    error,
  };
}

function baseRow(
  { chunks: _chunks, path: _path, ...source }: Awaited<ReturnType<typeof prepareDocument>>,
  model: ModelConfig,
) {
  return { source, model };
}

function sum<T>(items: T[], select: (item: T) => number) {
  return items.reduce((total, item) => total + select(item), 0);
}

async function writeCheckpoint(checkpointRows: BenchmarkRow[]) {
  await mkdir("results", { recursive: true });
  await writeFile(
    "results/checkpoint.json",
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        methodologyVersion: 1,
        incomplete: true,
        rows: checkpointRows,
      },
      null,
      2,
    ),
  );
}
