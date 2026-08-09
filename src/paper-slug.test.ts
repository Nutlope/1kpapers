import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPaperSlugMap, MAX_PAPER_SLUG_LENGTH, slugifyPaperTitle } from "../site/lib/paper-slug.js";

describe("paper slugs", () => {
  it("keeps model version numbers readable", () => {
    assert.equal(
      slugifyPaperTitle("Kimi K2.5: Visual Agentic Intelligence"),
      "kimi-k2-5-visual-agentic-intelligence",
    );
  });

  it("caps long slugs at a whole-word boundary", () => {
    const slug = slugifyPaperTitle(
      "A very long paper title about multimodal reasoning systems and visual agents operating across many environments without supervision",
    );
    assert.ok(slug.length <= MAX_PAPER_SLUG_LENGTH);
    assert.ok(!slug.endsWith("-"));
    assert.equal(slug, "a-very-long-paper-title-about-multimodal-reasoning-systems-and-visual-agents");
  });

  it("adds stable short suffixes when normalized titles collide", () => {
    const papers = [
      { id: "arxiv-2", title: "Vision: Agents" },
      { id: "arxiv-1", title: "Vision — Agents" },
    ];
    const first = buildPaperSlugMap(papers);
    const reordered = buildPaperSlugMap([...papers].reverse());

    assert.notEqual(first.get("arxiv-1"), first.get("arxiv-2"));
    assert.equal(first.get("arxiv-1"), reordered.get("arxiv-1"));
    assert.equal(first.get("arxiv-2"), reordered.get("arxiv-2"));
    assert.ok([...first.values()].every((slug) => slug.length <= MAX_PAPER_SLUG_LENGTH));
  });

  it("keeps an already-published slug when a later title collides", () => {
    const slugs = buildPaperSlugMap([
      { id: "arxiv-old", title: "Vision Agents", slug: "vision-agents" },
      { id: "arxiv-new", title: "Vision: Agents" },
    ]);

    assert.equal(slugs.get("arxiv-old"), "vision-agents");
    assert.match(slugs.get("arxiv-new") ?? "", /^vision-agents-[a-z0-9]{7}$/);
  });
});
