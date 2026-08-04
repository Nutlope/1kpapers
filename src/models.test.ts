import assert from "node:assert/strict";
import test from "node:test";
import { calculateCost, MODELS } from "./models.js";

test("calculates standard token cost", () => {
  const flash = MODELS.find((model) => model.label === "DeepSeek V4 Flash")!;
  assert.equal(calculateCost(flash, 1_000_000, 1_000_000), 0.42);
});
