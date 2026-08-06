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
    normalizeFinalSummaryMarkdown("Uses <think> tokens.\n\n- Result.")?.markdown,
    "Uses &lt;think&gt; tokens.\n\n- Result.",
  );
  assert.equal(
    normalizeFinalSummaryMarkdown("<p>HTML overview.</p>\n\n- Result.")?.markdown,
    "&lt;p&gt;HTML overview.&lt;/p&gt;\n\n- Result.",
  );
  assert.equal(isValidFinalSummaryMarkdown("<!-- hidden -->"), false);
  assert.equal(
    isValidFinalSummaryMarkdown(
      "The estimator is biased when p_t < 0.5 and p_t > 0.5.\n\n- The boundary is p_t = 0.5.",
    ),
    true,
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

test("preserves short chunk Markdown and safely shortens oversized chunks", () => {
  const chunk = "# Overview\n\nSeveral chunk paragraphs are valid here.";
  assert.deepEqual(normalizeSummaryForStage(chunk, "chunk"), {
    summary: chunk,
    normalized: false,
  });
  assert.deepEqual(normalizeSummaryForStage(chunk, "reduce"), {
    summary: "Overview\n\nSeveral chunk paragraphs are valid here.",
    normalized: false,
  });
  const oversized = Array.from({ length: 401 }, () => "word").join(" ");
  const normalized = normalizeSummaryForStage(oversized, "chunk");
  assert.equal(normalized?.normalized, true);
  assert.equal(normalized?.summary.split(/\s+/).length, 400);
  assert.match(normalized?.summary ?? "", /…$/);
});
