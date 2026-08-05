import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAnthropicPayload,
  ModelOutputError,
  ProviderError,
  isRetryableStatus,
  retryAfterMs,
  withRetry,
} from "./providers.js";
import { MODELS } from "./models.js";

test("retries transient provider failures and reports the attempt count", async () => {
  let calls = 0;
  const result = await withRetry(
    async () => {
      calls += 1;
      if (calls < 3) throw new TypeError("temporary network failure");
      return "ok";
    },
    { maxAttempts: 3, retryBaseMs: 0 },
  );
  assert.deepEqual(result, { value: "ok", attempts: 3 });
});

test("does not retry permanent provider failures", async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(
      async () => {
        calls += 1;
        throw new ProviderError("bad request", false, null);
      },
      { maxAttempts: 3, retryBaseMs: 0 },
    ),
    /bad request/,
  );
  assert.equal(calls, 1);
});

test("retries malformed model output", async () => {
  let calls = 0;
  const retried: string[] = [];
  const result = await withRetry(
    async () => {
      calls += 1;
      if (calls === 1) throw new ModelOutputError("truncated JSON");
      return "ok";
    },
    {
      maxAttempts: 2,
      retryBaseMs: 0,
      onRetry(error) {
        retried.push(error instanceof Error ? error.message : String(error));
      },
    },
  );
  assert.deepEqual(result, { value: "ok", attempts: 2 });
  assert.deepEqual(retried, ["truncated JSON"]);
});

test("classifies retryable statuses and retry-after seconds", () => {
  assert.equal(isRetryableStatus(429), true);
  assert.equal(isRetryableStatus(503), true);
  assert.equal(isRetryableStatus(400), false);
  assert.equal(retryAfterMs("1.5"), 1_500);
});

test("uses Anthropic's GA JSON-schema output contract", () => {
  const model = MODELS.find((candidate) => candidate.provider === "anthropic")!;
  const payload = buildAnthropicPayload(model, "paper text", "reduce");
  assert.equal(payload.output_config.format.type, "json_schema");
  assert.deepEqual(payload.output_config.format.schema.required, ["title", "summary"]);
  assert.equal(payload.output_config.format.schema.properties.summary.maxLength, 3_000);
});
