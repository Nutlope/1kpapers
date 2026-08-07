import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePaperSummaryMarkdown } from "../site/lib/paper-summary";

describe("paper summary formatting", () => {
  it("preserves overview paragraphs and renders Markdown bullets separately", () => {
    assert.deepEqual(
      parsePaperSummaryMarkdown(
        "Overview sentence one. Sentence two.\n\n- First result.\n- Second result.",
      ),
      {
        paragraphs: ["Overview sentence one.", "Sentence two."],
        bullets: ["First result.", "Second result."],
      },
    );
  });

  it("splits an unformatted legacy summary into scannable sentence blocks", () => {
    assert.deepEqual(
      parsePaperSummaryMarkdown("Sentence one. Sentence two."),
      {
        paragraphs: ["Sentence one.", "Sentence two."],
        bullets: [],
      },
    );
  });
});
