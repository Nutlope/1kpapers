import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import path from "node:path";
import { MODELS, calculateCost } from "./models.js";
import { prepareDocument } from "./pdf.js";
import { ModelOutputError, summarize } from "./providers.js";
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
const methodologyVersion = 11;
const documentTimeoutMs = positiveInteger(
  process.env.BENCHMARK_DOCUMENT_TIMEOUT_MS ?? "180000",
  "BENCHMARK_DOCUMENT_TIMEOUT_MS",
);
const concurrency = positiveInteger(
  args.concurrency ?? process.env.BENCHMARK_CONCURRENCY ?? "4",
  "concurrency",
);
const runConfig = {
  methodologyVersion,
  sourceFile,
  models: models.map((model) => ({
    id: model.id,
    inputUsdPerMillion: model.inputUsdPerMillion,
    outputUsdPerMillion: model.outputUsdPerMillion,
    pricingRetrievedAt: model.pricingRetrievedAt,
    pricingMode: model.pricingMode,
  })),
  sources: sources.map((source) => source.id),
  concurrency,
  requestPolicy: {
    timeoutMs: Number(process.env.BENCHMARK_TIMEOUT_MS ?? 90_000),
    maxAttempts: Number(process.env.BENCHMARK_MAX_ATTEMPTS ?? 2),
    retryBaseMs: Number(process.env.BENCHMARK_RETRY_BASE_MS ?? 1_000),
    documentTimeoutMs,
  },
};
const fingerprint = createHash("sha256")
  .update(JSON.stringify(runConfig))
  .digest("hex")
  .slice(0, 12);
const defaultRunId = `${path.basename(sourceFile, path.extname(sourceFile))}-${fingerprint}`;
const runId = safeRunId(args["run-id"] ?? defaultRunId);
const runDirectory = path.resolve(args["output-dir"] ?? `results/runs/${runId}`);
const checkpointPath = path.join(runDirectory, "checkpoint.json");

if (!models.length || !sources.length) {
  throw new Error("No models or sources matched the supplied filters");
}

for (const provider of new Set(models.map((model) => model.provider))) {
  const keyName = `${provider.toUpperCase()}_API_KEY`;
  if (!process.env[keyName]) throw new Error(`Missing ${keyName}`);
}

const documents = [];
for (const source of sources) documents.push(await prepareDocument(source));

const prior = args.resume === "false" ? null : await readCheckpoint(checkpointPath);
if (prior && prior.fingerprint !== fingerprint) {
  throw new Error(
    `Checkpoint ${checkpointPath} belongs to a different benchmark configuration`,
  );
}
const rows: BenchmarkRow[] = prior?.rows ?? [];
const completed = new Set(
  rows
    .filter((row) => args["rerun-failed"] !== "true" || row.status === "ok")
    .map(rowKey),
);
for (const model of models) {
  for (const document of documents) {
    const key = rowKey({ model, source: document });
    if (completed.has(key)) {
      console.error(`Resuming: keeping ${model.label} / ${document.title}`);
      continue;
    }
    const existingIndex = rows.findIndex((row) => rowKey(row) === key);
    if (existingIndex >= 0) rows.splice(existingIndex, 1);
    console.error(`Running ${model.label} on ${document.title} (${document.chunks.length} chunks)`);
    const row = await runDocument(model, document);
    rows.push(row);
    completed.add(key);
    await writeCheckpoint(rows, true);
  }
}

const generatedAt = new Date().toISOString();
const result = {
  generatedAt,
  methodologyVersion,
  runId,
  fingerprint,
  runConfig,
  rows,
};
await mkdir(runDirectory, { recursive: true });
await mkdir("results/raw", { recursive: true });
const stamp = generatedAt.replaceAll(":", "-");
await writeFile(path.join(runDirectory, "result.json"), JSON.stringify(result, null, 2));
await writeFile(`results/raw/${stamp}.json`, JSON.stringify(result, null, 2));
await writeFile("results/latest.json", JSON.stringify(result, null, 2));
await writeCheckpoint(rows, false);
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
  const controller = new AbortController();
  const documentTimer = setTimeout(
    () =>
      controller.abort(
        new DOMException(
          `Document exceeded ${documentTimeoutMs}ms deadline`,
          "TimeoutError",
        ),
      ),
    documentTimeoutMs,
  );
  let completedRequests: RequestResult[] = [];
  try {
    const settledChunks = await settleWithConcurrency(
      document.chunks,
      concurrency,
      async (text, chunkIndex) => {
        const inference = await summarize(model, text, "chunk", controller.signal);
        return toRequest(model, inference, "chunk", chunkIndex);
      },
    );
    const chunkOutputs = settledChunks
      .filter(
        (result): result is PromiseFulfilledResult<RequestResult> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);
    const chunkFailures = settledChunks
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      )
      .map((result) => result.reason);
    if (chunkFailures.length) {
      return failedRow(
        document,
        model,
        chunkOutputs,
        performance.now() - started,
        `${chunkFailures.length}/${document.chunks.length} chunk requests failed: ${chunkFailures.map(errorMessage).join("; ")}`,
        chunkFailures,
      );
    }
    completedRequests = chunkOutputs;
    const reduceInput = chunkOutputs.map((row) => row.summary).join("\n\n");
    const final = await summarize(model, reduceInput, "reduce", controller.signal);
    const reduceOutput = toRequest(model, final, "reduce", null);
    const requests = [...chunkOutputs, reduceOutput];
    return completeRow(document, model, requests, performance.now() - started);
  } catch (error) {
    return failedRow(
      document,
      model,
      completedRequests,
      performance.now() - started,
      errorMessage(error),
      [error],
    );
  } finally {
    clearTimeout(documentTimer);
  }
}

function failedRow(
  document: Awaited<ReturnType<typeof prepareDocument>>,
  model: ModelConfig,
  requests: RequestResult[],
  totalLatencyMs: number,
  error: string,
  requestErrors: unknown[] = [],
): BenchmarkRow {
  const failedUsage = requestErrors.reduce<{
    inputTokens: number;
    outputTokens: number;
  }>(
    (usage, requestError) =>
      requestError instanceof ModelOutputError
        ? {
            inputTokens: usage.inputTokens + requestError.usage.inputTokens,
            outputTokens: usage.outputTokens + requestError.usage.outputTokens,
          }
        : usage,
    { inputTokens: 0, outputTokens: 0 },
  );
  return {
    ...baseRow(document, model),
    status: "failed",
    requests,
    failedRequestRetries: requestErrors.reduce<number>(
      (total, requestError) =>
        total + Math.max(0, errorAttempts(requestError) - 1),
      0,
    ),
    totalInputTokens:
      sum(requests, (row) => row.usage.inputTokens) + failedUsage.inputTokens,
    totalOutputTokens:
      sum(requests, (row) => row.usage.outputTokens) + failedUsage.outputTokens,
    totalCostUsd:
      sum(requests, (row) => row.costUsd) +
      calculateCost(model, failedUsage.inputTokens, failedUsage.outputTokens),
    totalLatencyMs: Math.round(totalLatencyMs),
    withinThirtySeconds: false,
    finalTitle: null,
    finalSummary: null,
    error,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function errorAttempts(error: unknown) {
  return error instanceof Error &&
    "attempts" in error &&
    typeof error.attempts === "number"
    ? error.attempts
    : 1;
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

function baseRow(
  { chunks: _chunks, path: _path, ...source }: Awaited<ReturnType<typeof prepareDocument>>,
  model: ModelConfig,
) {
  return { source, model };
}

function sum<T>(items: T[], select: (item: T) => number) {
  return items.reduce((total, item) => total + select(item), 0);
}

async function writeCheckpoint(
  checkpointRows: BenchmarkRow[],
  incomplete: boolean,
) {
  await mkdir(runDirectory, { recursive: true });
  await writeFile(
    checkpointPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        methodologyVersion,
        runId,
        fingerprint,
        runConfig,
        incomplete,
        rows: checkpointRows,
      },
      null,
      2,
    ),
  );
}

async function readCheckpoint(file: string) {
  try {
    return JSON.parse(await readFile(file, "utf8")) as {
      fingerprint: string;
      rows: BenchmarkRow[];
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function rowKey(row: Pick<BenchmarkRow, "model" | "source">) {
  return `${row.model.id}\u0000${row.source.id}`;
}

async function settleWithConcurrency<T, R>(
  items: T[],
  limit: number,
  operation: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results = Array<PromiseSettledResult<R>>(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await operation(items[index]!, index),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

function positiveInteger(value: string, name: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function safeRunId(value: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(value))
    throw new Error("run-id may contain only letters, numbers, dots, underscores, and dashes");
  return value;
}
