import assert from "node:assert/strict";
import test from "node:test";
import {
  estimateJudgeInputTokens,
  judgeContextDecision,
} from "./judge-policy.js";

test("estimates judge input conservatively", () => {
  assert.equal(estimateJudgeInputTokens(1_000_000), 333_334);
});

test("rejects inputs that would crowd out the judge response", () => {
  assert.deepEqual(
    judgeContextDecision({
      inputCharacters: 780_000,
      contextWindowTokens: 262_144,
      maxOutputTokens: 4_000,
    }),
    {
      estimatedInputTokens: 260_000,
      availableInputTokens: 258_144,
      fits: false,
    },
  );
});
