import { performance } from "node:perf_hooks";
import { buildSummaryPrompt, summarySchema } from "./prompts.js";
import type { Inference, ModelConfig } from "./types.js";

const TIMEOUT_MS = Number(process.env.BENCHMARK_TIMEOUT_MS ?? 120_000);

export async function summarize(
  model: ModelConfig,
  text: string,
  stage: "chunk" | "reduce",
): Promise<Inference> {
  if (model.provider === "anthropic")
    return summarizeAnthropic(model, text, stage);
  return summarizeOpenAICompatible(model, text, stage);
}

async function summarizeOpenAICompatible(
  model: ModelConfig,
  text: string,
  stage: "chunk" | "reduce",
): Promise<Inference> {
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
    payload.max_tokens = stage === "reduce" ? 1_000 : 1_600;
    payload.response_format = { type: "json_object" };
    payload.reasoning = { enabled: false };
    payload.temperature = 0;
  } else {
    payload.max_completion_tokens = stage === "reduce" ? 1_000 : 1_600;
    payload.response_format = {
      type: "json_schema",
      json_schema: { name: "summary", strict: true, schema: summarySchema },
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
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await response.json()) as Record<string, any>;
  if (!response.ok) {
    throw new Error(
      `${model.id} failed (${response.status}): ${body.error?.message ?? "unknown error"}`,
    );
  }
  return parseInference({
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
    body: JSON.stringify({
      model: model.id,
      system: buildSummaryPrompt("english", stage),
      messages: [{ role: "user", content: text }],
      max_tokens: stage === "reduce" ? 1_000 : 1_600,
      temperature: 0,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await response.json()) as Record<string, any>;
  if (!response.ok) {
    throw new Error(
      `${model.id} failed (${response.status}): ${body.error?.message ?? "unknown error"}`,
    );
  }
  const content = body.content
    ?.filter((part: { type: string }) => part.type === "text")
    .map((part: { text: string }) => part.text)
    .join("\n");
  return parseInference({
    content,
    inputTokens: body.usage?.input_tokens,
    outputTokens: body.usage?.output_tokens,
    finishReason: body.stop_reason,
    latencyMs: performance.now() - started,
  });
}

function parseInference(input: {
  content: unknown;
  inputTokens: unknown;
  outputTokens: unknown;
  finishReason: unknown;
  latencyMs: number;
}): Inference {
  if (typeof input.content !== "string") throw new Error("Model returned no text");
  const cleaned = input.content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed = JSON.parse(cleaned) as { title?: unknown; summary?: unknown };
  if (
    typeof parsed.title !== "string" ||
    !parsed.title ||
    typeof parsed.summary !== "string" ||
    !parsed.summary ||
    parsed.summary.length > 5_000
  ) {
    throw new Error("Model response did not match the summary schema");
  }
  return {
    title: parsed.title,
    summary: parsed.summary,
    usage: {
      inputTokens: Number(input.inputTokens ?? 0),
      outputTokens: Number(input.outputTokens ?? 0),
    },
    latencyMs: Math.round(input.latencyMs),
    finishReason:
      typeof input.finishReason === "string" ? input.finishReason : null,
  };
}
