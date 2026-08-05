import assert from "node:assert/strict";
import test from "node:test";
import {
  ProviderError,
  isRetryableStatus,
  retryAfterMs,
  withRetry,
} from "./providers.js";

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

test("classifies retryable statuses and retry-after seconds", () => {
  assert.equal(isRetryableStatus(429), true);
  assert.equal(isRetryableStatus(503), true);
  assert.equal(isRetryableStatus(400), false);
  assert.equal(retryAfterMs("1.5"), 1_500);
});
