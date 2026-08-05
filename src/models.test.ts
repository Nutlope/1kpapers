import assert from "node:assert/strict";
import test from "node:test";
import { calculateCost, MODELS } from "./models.js";

test("calculates standard token cost", () => {
  const flash = MODELS.find((model) => model.label === "DeepSeek V4 Flash")!;
  assert.equal(calculateCost(flash, 1_000_000, 1_000_000), 0.42);
});

test("freezes the five-model standard synchronous matrix", () => {
  assert.deepEqual(
    MODELS.map((model) => model.id),
    [
      "deepseek-ai/DeepSeek-V4-Flash-0731",
      "Qwen/Qwen3.5-9B",
      "MiniMaxAI/MiniMax-M3",
      "claude-haiku-4-5-20251001",
      "gpt-5.6-luna",
    ],
  );
  assert.ok(MODELS.every((model) => model.pricingMode === "standard-synchronous"));
  assert.ok(MODELS.every((model) => model.pricingRetrievedAt === "2026-08-05"));
});
