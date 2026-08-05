import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { calculateCost, MODELS } from "./models.js";
import { prepareDocument } from "./pdf.js";
import {
  buildSummaryPrompt,
  isValidFinalSummaryMarkdown,
  normalizeSummaryForStage,
  summarySchema,
} from "./prompts.js";
import type {
  BenchmarkRow,
  DocumentInfo,
  ModelConfig,
  RequestResult,
  Source,
} from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...parts] = arg.replace(/^--/, "").split("=");
    return [key, parts.length ? parts.join("=") : "true"];
  }),
) as Record<string, string>;
const apiKey = process.env.TOGETHER_API_KEY;
if (!apiKey) throw new Error("Missing TOGETHER_API_KEY");

const model = MODELS.find(
  (candidate) =>
    candidate.id ===
    (args.model ?? "deepseek-ai/DeepSeek-V4-Flash-0731"),
);
if (!model || model.provider !== "together") {
  throw new Error("Together batch runner requires a configured Together model");
}

const sourceFile = path.resolve(args["source-file"] ?? "corpus/sources-1000.json");
const excludeCheckpoint = args["exclude-checkpoint"]
  ? path.resolve(args["exclude-checkpoint"])
  : null;
const runId = safeRunId(
  args["run-id"] ??
    `batch-${model.id.split("/").at(-1)}-${new Date().toISOString().slice(0, 10)}`,
);
const cacheDirectory = path.resolve(".cache/batches", runId);
const resultDirectory = path.resolve("results/runs", runId);
const statePath = path.join(cacheDirectory, "state.json");
const maxInputBytes = positiveInteger(
  args["max-input-bytes"] ?? "80000000",
  "max-input-bytes",
);
const pollMs = positiveInteger(args["poll-ms"] ?? "30000", "poll-ms");

type BatchJobState = {
  inputPath: string;
  inputBytes: number;
  sourceIds: string[];
  fileId: string;
  batchId: string;
  status: string;
  progress: number;
  outputFileId: string | null;
  errorFileId: string | null;
  completedAt: string | null;
};
type BatchState = {
  runId: string;
  createdAt: string;
  sourceFile: string;
  excludedCheckpoint: string | null;
  modelId: string;
  jobs: BatchJobState[];
};

await mkdir(cacheDirectory, { recursive: true });
await mkdir(resultDirectory, { recursive: true });

let state = await readState();
const allSources = JSON.parse(await readFile(sourceFile, "utf8")) as Source[];
const requestedIds = new Set(
  (args.sources ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
let selectedSources: Source[];
if (state) {
  const selectedIds = new Set(state.jobs.flatMap((job) => job.sourceIds));
  selectedSources = allSources.filter((source) => selectedIds.has(source.id));
  if (selectedSources.length !== selectedIds.size) {
    throw new Error("Batch state references sources missing from the source file");
  }
  console.error(
    `Resuming ${state.jobs.length} batch jobs for ${selectedSources.length} sources`,
  );
} else {
  const excluded = excludeCheckpoint
    ? await completedSourceIds(excludeCheckpoint, model.id)
    : new Set<string>();
  selectedSources = allSources.filter(
    (source) =>
      !excluded.has(source.id) &&
      (!requestedIds.size || requestedIds.has(source.id)),
  );
  if (!selectedSources.length) throw new Error("No pending sources remain");
  console.error(
    `Preparing ${selectedSources.length} sources (${excluded.size} excluded from checkpoint)`,
  );
}

const documents = new Map<string, DocumentInfo>();
for (const source of selectedSources) {
  const document = await prepareDocument(source);
  if (document.characters > model.contextWindowTokens * 2) {
    throw new Error(
      `${source.id} exceeds the conservative one-pass context budget`,
    );
  }
  documents.set(source.id, document);
}

if (!state) {
  const inputGroups = splitInputs([...documents.values()], model, maxInputBytes);
  const jobs: BatchJobState[] = [];
  state = {
    runId,
    createdAt: new Date().toISOString(),
    sourceFile,
    excludedCheckpoint: excludeCheckpoint,
    modelId: model.id,
    jobs,
  };
  for (const [index, group] of inputGroups.entries()) {
    const inputPath = path.join(
      cacheDirectory,
      `input-${String(index + 1).padStart(3, "0")}.jsonl`,
    );
    const contents = group.map((item) => item.line).join("");
    await writeFile(inputPath, contents);
    const fileId = await uploadInput(inputPath, contents);
    const batch = await createBatch(fileId);
    jobs.push({
      inputPath,
      inputBytes: Buffer.byteLength(contents),
      sourceIds: group.map((item) => item.sourceId),
      fileId,
      batchId: batch.id,
      status: batch.status,
      progress: Number(batch.progress ?? 0),
      outputFileId: null,
      errorFileId: null,
      completedAt: null,
    });
    await writeState(state);
    console.error(
      `Submitted batch ${batch.id} with ${group.length} requests (${formatBytes(Buffer.byteLength(contents))})`,
    );
  }
}

const terminal = new Set(["COMPLETED", "FAILED", "EXPIRED", "CANCELLED"]);
while (state.jobs.some((job) => !terminal.has(job.status))) {
  for (const job of state.jobs) {
    if (terminal.has(job.status)) continue;
    const batch = await getBatch(job.batchId);
    job.status = batch.status;
    job.progress = Number(batch.progress ?? 0);
    job.outputFileId = batch.output_file_id ?? null;
    job.errorFileId = batch.error_file_id ?? null;
    if (terminal.has(job.status)) job.completedAt = new Date().toISOString();
    console.error(`${job.batchId}: ${job.status} ${job.progress.toFixed(1)}%`);
  }
  await writeState(state);
  if (state.jobs.some((job) => !terminal.has(job.status))) await delay(pollMs);
}

const rows: BenchmarkRow[] = [];
for (const [index, job] of state.jobs.entries()) {
  if (job.status !== "COMPLETED") {
    throw new Error(`Batch ${job.batchId} ended with ${job.status}`);
  }
  const outputText = job.outputFileId
    ? await downloadFile(job.outputFileId)
    : "";
  const errorText = job.errorFileId ? await downloadFile(job.errorFileId) : "";
  await writeFile(
    path.join(cacheDirectory, `output-${String(index + 1).padStart(3, "0")}.jsonl`),
    outputText,
  );
  if (errorText) {
    await writeFile(
      path.join(cacheDirectory, `errors-${String(index + 1).padStart(3, "0")}.jsonl`),
      errorText,
    );
  }
  for (const line of nonEmptyLines(outputText)) {
    const item = JSON.parse(line) as BatchOutput;
    rows.push(outputRow(item, documents, model));
  }
  for (const line of nonEmptyLines(errorText)) {
    const item = JSON.parse(line) as BatchError;
    rows.push(errorRow(item, documents, model));
  }
}

const expectedIds = new Set(selectedSources.map((source) => source.id));
const returnedIds = new Set(rows.map((row) => row.source.id));
if (
  rows.length !== expectedIds.size ||
  [...expectedIds].some((sourceId) => !returnedIds.has(sourceId))
) {
  throw new Error(
    `Expected ${expectedIds.size} unique batch rows, received ${returnedIds.size}`,
  );
}

const completedAt = new Date().toISOString();
const result = {
  generatedAt: completedAt,
  methodologyVersion: 11,
  runId,
  fingerprint: createHash("sha256")
    .update(
      JSON.stringify({
        sourceFile,
        modelId: model.id,
        sourceIds: [...expectedIds],
        executionMode: "together-batch",
      }),
    )
    .digest("hex")
    .slice(0, 12),
  runConfig: {
    methodologyVersion: 11,
    sourceFile,
    model: model.id,
    sources: [...expectedIds],
    executionMode: "together-batch",
    singlePass: true,
    batchCreatedAt: state.createdAt,
    batchCompletedAt: completedAt,
    batchWallTimeMs: Date.parse(completedAt) - Date.parse(state.createdAt),
    jobs: state.jobs.map((job) => ({
      id: job.batchId,
      requests: job.sourceIds.length,
      inputBytes: job.inputBytes,
    })),
  },
  rows,
};
await writeFile(
  path.join(resultDirectory, "result.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  `Saved ${rows.length} rows (${rows.filter((row) => row.status === "ok").length} completed) to ${path.join(resultDirectory, "result.json")}`,
);

type BatchOutput = {
  custom_id: string;
  response?: {
    status_code?: number;
    body?: {
      choices?: Array<{
        message?: { content?: unknown };
        finish_reason?: unknown;
      }>;
      usage?: {
        prompt_tokens?: unknown;
        completion_tokens?: unknown;
      };
      error?: { message?: unknown };
    };
  };
};
type BatchError = {
  custom_id: string;
  error?: { message?: unknown; code?: unknown };
};

function outputRow(
  item: BatchOutput,
  documentsById: Map<string, DocumentInfo>,
  batchModel: ModelConfig,
): BenchmarkRow {
  const document = requiredDocument(item.custom_id, documentsById);
  const body = item.response?.body;
  const usage = {
    inputTokens: Number(body?.usage?.prompt_tokens ?? 0),
    outputTokens: Number(body?.usage?.completion_tokens ?? 0),
  };
  const statusCode = Number(item.response?.status_code ?? 0);
  if (statusCode !== 200) {
    return failedRow(
      document,
      batchModel,
      usage,
      `Batch request failed (${statusCode}): ${String(body?.error?.message ?? "unknown error")}`,
    );
  }
  const raw = body?.choices?.[0]?.message?.content;
  try {
    if (typeof raw !== "string") throw new Error("Model returned no text");
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    const parsed = JSON.parse(cleaned) as { title?: unknown; summary?: unknown };
    if (
      typeof parsed.title !== "string" ||
      !parsed.title.trim() ||
      typeof parsed.summary !== "string" ||
      !parsed.summary.trim()
    ) {
      throw new Error("Model response did not match the summary schema");
    }
    const normalized = normalizeSummaryForStage(parsed.summary, "reduce");
    if (!normalized || !isValidFinalSummaryMarkdown(normalized.summary)) {
      throw new Error("Model response did not match the final Markdown contract");
    }
    const request: RequestResult = {
      title: truncateTitle(parsed.title),
      summary: normalized.summary,
      normalized: normalized.normalized,
      usage,
      latencyMs: 0,
      finishReason:
        typeof body?.choices?.[0]?.finish_reason === "string"
          ? body.choices[0].finish_reason
          : null,
      attempts: 1,
      stage: "reduce",
      chunkIndex: null,
      costUsd: calculateCost(
        batchModel,
        usage.inputTokens,
        usage.outputTokens,
      ),
    };
    return {
      ...baseRow(document, batchModel),
      status: "ok",
      requests: [request],
      totalInputTokens: usage.inputTokens,
      totalOutputTokens: usage.outputTokens,
      totalCostUsd: request.costUsd,
      totalLatencyMs: 0,
      withinThirtySeconds: false,
      finalTitle: request.title,
      finalSummary: request.summary,
      error: null,
    };
  } catch (error) {
    return failedRow(
      document,
      batchModel,
      usage,
      error instanceof Error ? error.message : String(error),
    );
  }
}

function errorRow(
  item: BatchError,
  documentsById: Map<string, DocumentInfo>,
  batchModel: ModelConfig,
) {
  const message = item.error?.message ?? item.error?.code ?? "unknown batch error";
  return failedRow(
    requiredDocument(item.custom_id, documentsById),
    batchModel,
    { inputTokens: 0, outputTokens: 0 },
    String(message),
  );
}

function failedRow(
  document: DocumentInfo,
  batchModel: ModelConfig,
  usage: { inputTokens: number; outputTokens: number },
  error: string,
): BenchmarkRow {
  return {
    ...baseRow(document, batchModel),
    status: "failed",
    requests: [],
    totalInputTokens: usage.inputTokens,
    totalOutputTokens: usage.outputTokens,
    totalCostUsd: calculateCost(
      batchModel,
      usage.inputTokens,
      usage.outputTokens,
    ),
    totalLatencyMs: 0,
    withinThirtySeconds: false,
    finalTitle: null,
    finalSummary: null,
    error,
  };
}

function baseRow(document: DocumentInfo, batchModel: ModelConfig) {
  const { chunks: _chunks, path: _path, ...source } = document;
  return { source, model: batchModel };
}

function requiredDocument(
  sourceId: string,
  documentsById: Map<string, DocumentInfo>,
) {
  const document = documentsById.get(sourceId);
  if (!document) throw new Error(`Unknown batch custom_id: ${sourceId}`);
  return document;
}

function splitInputs(
  inputDocuments: DocumentInfo[],
  batchModel: ModelConfig,
  limit: number,
) {
  const groups: Array<Array<{ sourceId: string; line: string }>> = [];
  let current: Array<{ sourceId: string; line: string }> = [];
  let currentBytes = 0;
  for (const document of inputDocuments) {
    const line = `${JSON.stringify({
      custom_id: document.id,
      body: {
        model: batchModel.id,
        messages: [
          { role: "system", content: buildSummaryPrompt("english", "reduce") },
          { role: "user", content: document.chunks.join("") },
        ],
        max_tokens: 1_600,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "summary",
            schema: summarySchema("reduce"),
          },
        },
        reasoning: { enabled: false },
        temperature: 0,
      },
    })}\n`;
    const lineBytes = Buffer.byteLength(line);
    if (lineBytes > 10_000_000) {
      throw new Error(`${document.id} exceeds the 10 MB batch-line limit`);
    }
    if (current.length && currentBytes + lineBytes > limit) {
      groups.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push({ sourceId: document.id, line });
    currentBytes += lineBytes;
  }
  if (current.length) groups.push(current);
  return groups;
}

async function uploadInput(inputPath: string, contents: string) {
  const form = new FormData();
  const fileName = path.basename(inputPath);
  form.set("purpose", "batch-api");
  form.set("file_name", fileName);
  form.set("file", new Blob([contents]), fileName);
  const response = await fetch("https://api.together.ai/v1/files/upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  const body = (await response.json()) as { id?: unknown; error?: unknown };
  if (!response.ok || typeof body.id !== "string") {
    throw new Error(`Batch upload failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body.id;
}

async function createBatch(fileId: string) {
  const response = await apiFetch("/v1/batches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input_file_id: fileId,
      endpoint: "/v1/chat/completions",
    }),
  });
  const body = (await response.json()) as {
    job?: { id?: unknown; status?: unknown; progress?: unknown };
  };
  if (
    !response.ok ||
    typeof body.job?.id !== "string" ||
    typeof body.job.status !== "string"
  ) {
    throw new Error(`Batch creation failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return {
    id: body.job.id,
    status: body.job.status,
    progress: body.job.progress,
  };
}

async function getBatch(batchId: string) {
  const response = await apiFetch(`/v1/batches/${batchId}`);
  const body = (await response.json()) as {
    status?: unknown;
    progress?: unknown;
    output_file_id?: unknown;
    error_file_id?: unknown;
  };
  if (!response.ok || typeof body.status !== "string") {
    throw new Error(`Batch lookup failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body as {
    status: string;
    progress?: number;
    output_file_id?: string | null;
    error_file_id?: string | null;
  };
}

async function downloadFile(fileId: string) {
  const response = await apiFetch(`/v1/files/${fileId}/content`);
  if (!response.ok) {
    throw new Error(`Batch file download failed (${response.status})`);
  }
  return response.text();
}

function apiFetch(relativePath: string, init: RequestInit = {}) {
  return fetch(`https://api.together.ai${relativePath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...init.headers,
    },
  });
}

async function completedSourceIds(checkpointPath: string, modelId: string) {
  const checkpoint = JSON.parse(await readFile(checkpointPath, "utf8")) as {
    rows?: BenchmarkRow[];
  };
  return new Set(
    (checkpoint.rows ?? [])
      .filter((row) => row.model.id === modelId && row.status === "ok")
      .map((row) => row.source.id),
  );
}

async function readState() {
  try {
    return JSON.parse(await readFile(statePath, "utf8")) as BatchState;
  } catch {
    return null;
  }
}

function writeState(batchState: BatchState) {
  return writeFile(statePath, JSON.stringify(batchState, null, 2));
}

function nonEmptyLines(value: string) {
  return value.split("\n").filter((line) => line.trim());
}

function truncateTitle(value: string) {
  const title = value.trim().replace(/\s+/g, " ");
  if (title.length <= 300) return title;
  const candidate = title.slice(0, 299).replace(/\s+\S*$/, "").trimEnd();
  return `${candidate || title.slice(0, 299)}…`;
}

function safeRunId(value: string) {
  const safe = value.replace(/[^a-zA-Z0-9._-]/g, "-");
  if (!safe || safe === "." || safe === "..") throw new Error("Invalid run id");
  return safe;
}

function positiveInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`);
  }
  return parsed;
}

function formatBytes(value: number) {
  return `${(value / 1_000_000).toFixed(1)} MB`;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
