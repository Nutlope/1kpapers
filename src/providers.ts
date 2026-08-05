import { performance } from "node:perf_hooks";
import {
  buildSummaryPrompt,
  isValidFinalSummaryMarkdown,
  normalizeSummaryForStage,
  summarySchema,
} from "./prompts.js";
import type { Inference, ModelConfig } from "./types.js";

const TIMEOUT_MS = Number(process.env.BENCHMARK_TIMEOUT_MS ?? 90_000);
const MAX_ATTEMPTS = Number(process.env.BENCHMARK_MAX_ATTEMPTS ?? 2);
const RETRY_BASE_MS = Number(process.env.BENCHMARK_RETRY_BASE_MS ?? 1_000);

export async function summarize(
  model: ModelConfig,
  text: string,
  stage: "chunk" | "reduce",
  signal?: AbortSignal,
): Promise<Inference> {
  const { value, attempts } = await withRetry(() =>
    model.provider === "anthropic"
      ? summarizeAnthropic(model, text, stage, signal)
      : summarizeOpenAICompatible(model, text, stage, signal),
  );
  return { ...value, attempts };
}

async function summarizeOpenAICompatible(
  model: ModelConfig,
  text: string,
  stage: "chunk" | "reduce",
  signal?: AbortSignal,
): Promise<Omit<Inference, "attempts">> {
  const isTogether = model.provider === "together";
  const key = process.env[isTogether ? "TOGETHER_API_KEY" : "OPENAI_API_KEY"];
  if (!key) throw new Error(`Missing ${isTogether ? "TOGETHER" : "OPENAI"}_API_KEY`);
  const url = isTogether
    ? "https://api.together.xyz/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";
  const payload: Record<string, unknown> = {
    model: model.id,
    messages: [
      { role: "system", content: buildSummaryPrompt("english", stage) },
      { role: "user", content: text },
    ],
  };
  if (isTogether) {
    payload.max_tokens = stage === "reduce" ? 1_600 : 2_400;
    payload.response_format = {
      type: "json_schema",
      json_schema: { name: "summary", schema: summarySchema(stage) },
    };
    payload.reasoning = { enabled: false };
    payload.temperature = 0;
  } else {
    payload.max_completion_tokens = stage === "reduce" ? 1_600 : 2_400;
    payload.response_format = {
      type: "json_schema",
      json_schema: { name: "summary", strict: true, schema: summarySchema(stage) },
    };
    payload.reasoning_effort = "none";
  }

  const started = performance.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: requestSignal(signal),
  });
  const body = await responseBody(response, model.id);
  if (!response.ok) {
    throw new ProviderError(
      `${model.id} failed (${response.status}): ${body.error?.message ?? "unknown error"}`,
      isRetryableStatus(response.status),
      retryAfterMs(response.headers.get("retry-after")),
    );
  }
  return parseInference({
    stage,
    content: body.choices?.[0]?.message?.content,
    inputTokens: body.usage?.prompt_tokens,
    outputTokens: body.usage?.completion_tokens,
    finishReason: body.choices?.[0]?.finish_reason,
    latencyMs: performance.now() - started,
  });
}

async function summarizeAnthropic(
  model: ModelConfig,
  text: string,
  stage: "chunk" | "reduce",
  signal?: AbortSignal,
) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("Missing ANTHROPIC_API_KEY");
  const started = performance.now();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(buildAnthropicPayload(model, text, stage)),
    signal: requestSignal(signal),
  });
  const body = await responseBody(response, model.id);
  if (!response.ok) {
    throw new ProviderError(
      `${model.id} failed (${response.status}): ${body.error?.message ?? "unknown error"}`,
      isRetryableStatus(response.status),
      retryAfterMs(response.headers.get("retry-after")),
    );
  }
  const content = body.content
    ?.filter((part: { type: string }) => part.type === "text")
    .map((part: { text: string }) => part.text)
    .join("\n");
  return parseInference({
    stage,
    content,
    inputTokens: body.usage?.input_tokens,
    outputTokens: body.usage?.output_tokens,
    finishReason: body.stop_reason,
    latencyMs: performance.now() - started,
  });
}

export function buildAnthropicPayload(
  model: ModelConfig,
  text: string,
  stage: "chunk" | "reduce",
) {
  return {
    model: model.id,
    system: buildSummaryPrompt("english", stage),
    messages: [{ role: "user", content: text }],
    max_tokens: stage === "reduce" ? 1_600 : 2_400,
    temperature: 0,
    output_config: {
      format: {
        type: "json_schema",
        schema: summarySchema(stage),
      },
    },
  };
}

function parseInference(input: {
  stage: "chunk" | "reduce";
  content: unknown;
  inputTokens: unknown;
  outputTokens: unknown;
  finishReason: unknown;
  latencyMs: number;
}): Omit<Inference, "attempts"> {
  if (typeof input.content !== "string") throw new Error("Model returned no text");
  const cleaned = input.content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed: { title?: unknown; summary?: unknown };
  try {
    parsed = JSON.parse(cleaned) as { title?: unknown; summary?: unknown };
  } catch {
    throw new ModelOutputError(
      `Model returned invalid JSON (finish=${typeof input.finishReason === "string" ? input.finishReason : "unknown"}, content_length=${cleaned.length})`,
    );
  }
  if (
    typeof parsed.title !== "string" ||
    !parsed.title ||
    typeof parsed.summary !== "string" ||
    !parsed.summary ||
    parsed.summary.length > 5_000
  ) {
    throw new ModelOutputError("Model response did not match the summary schema");
  }
  const normalized = normalizeSummaryForStage(parsed.summary, input.stage);
  if (
    input.stage === "reduce" &&
    (!normalized || !isValidFinalSummaryMarkdown(normalized.summary))
  ) {
    throw new ModelOutputError("Model response did not match the final Markdown contract");
  }
  if (!normalized) throw new ModelOutputError("Model returned an empty summary");
  return {
    title: parsed.title,
    summary: normalized.summary,
    normalized: normalized.normalized,
    usage: {
      inputTokens: Number(input.inputTokens ?? 0),
      outputTokens: Number(input.outputTokens ?? 0),
    },
    latencyMs: Math.round(input.latencyMs),
    finishReason:
      typeof input.finishReason === "string" ? input.finishReason : null,
  };
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly retryAfterMs: number | null,
  ) {
    super(message);
  }
}

export class ModelOutputError extends Error {}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { maxAttempts?: number; retryBaseMs?: number } = {},
) {
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const retryBaseMs = options.retryBaseMs ?? RETRY_BASE_MS;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return { value: await operation(), attempts: attempt };
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !isRetryableError(error)) {
        if (error instanceof Error)
          Object.assign(error, { attempts: attempt });
        throw error;
      }
      const providerDelay = error instanceof ProviderError ? error.retryAfterMs : null;
      const delayMs = providerDelay ?? retryBaseMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function isRetryableError(error: unknown) {
  if (error instanceof ProviderError) return error.retryable;
  if (error instanceof ModelOutputError) return true;
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException)
    return error.name === "TimeoutError" || error.name === "AbortError";
  return false;
}

export function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

export function retryAfterMs(value: string | null) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1_000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

async function responseBody(response: Response, modelId: string) {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    throw new ProviderError(
      `${modelId} returned non-JSON HTTP ${response.status}`,
      isRetryableStatus(response.status),
      retryAfterMs(response.headers.get("retry-after")),
    );
  }
}

function requestSignal(external?: AbortSignal) {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  return external ? AbortSignal.any([external, timeout]) : timeout;
}
