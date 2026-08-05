import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSummaryPrompt,
  isValidFinalSummaryMarkdown,
  normalizeFinalSummaryMarkdown,
  normalizeSummaryForStage,
  summarySchema,
} from "./prompts.js";

test("final prompt has one unambiguous Markdown contract", () => {
  const prompt = buildSummaryPrompt("english", "reduce");
  assert.match(prompt, /exactly one short overview paragraph/);
  assert.match(prompt, /Markdown bullet lines/);
  assert.doesNotMatch(prompt, /<h3>/);
  assert.equal(summarySchema("reduce").properties.summary.maxLength, 3_000);
});

test("normalizes safe Markdown and rejects unsafe output", () => {
  assert.equal(
    isValidFinalSummaryMarkdown(
      "A short overview.\n\n- First result.\n- Second result.",
    ),
    true,
  );
  assert.equal(
    normalizeFinalSummaryMarkdown(
      "# Heading\n\nA short overview.\n\n* **Result.**",
    )?.markdown,
    "Heading\n\nA short overview.\n\n- Result.",
  );
  assert.equal(
    isValidFinalSummaryMarkdown("Overview without bullets."),
    true,
  );
  assert.equal(
    isValidFinalSummaryMarkdown("<p>HTML overview.</p>\n\n- Result."),
    false,
  );
  assert.equal(
    isValidFinalSummaryMarkdown(
      `${Array.from({ length: 251 }, () => "word").join(" ")}\n\n- Result.`,
    ),
    false,
  );
  const trimmed = normalizeFinalSummaryMarkdown(
    `${Array.from({ length: 100 }, () => "overview").join(" ")}\n\n- ${Array.from({ length: 192 }, () => "detail").join(" ")}`,
  );
  assert.equal(trimmed?.truncated, true);
  assert.equal(trimmed?.originalWordCount, 292);
  assert.equal(trimmed?.finalWordCount, 250);
  assert.equal(isValidFinalSummaryMarkdown(trimmed?.markdown ?? ""), true);
});

test("normalizes restricted Markdown only at the final reduce stage", () => {
  const chunk = "# Overview\n\nSeveral chunk paragraphs are valid here.";
  assert.deepEqual(normalizeSummaryForStage(chunk, "chunk"), {
    summary: chunk,
    normalized: false,
  });
  assert.deepEqual(normalizeSummaryForStage(chunk, "reduce"), {
    summary: "Overview\n\nSeveral chunk paragraphs are valid here.",
    normalized: false,
  });
});
