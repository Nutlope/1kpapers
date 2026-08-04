import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalArxivId,
  isPublishedInCorpusWindow,
  parseArxivFeed,
  selectCorpus,
  type DailyPaper,
  type OfficialLabSeed,
} from "./corpus.js";

function paper(arxivId: string, hfUpvotes: number): DailyPaper {
  return {
    arxivId,
    title: `Paper ${arxivId}`,
    authors: ["Researcher"],
    abstract: "An AI paper.",
    publishedAt: "2026-01-01T00:00:00Z",
    submittedOnDailyAt: "2026-01-02T00:00:00Z",
    hfUpvotes,
  };
}

test("guarantees official-lab papers while preserving the corpus limit", () => {
  const daily = [paper("2601.00001", 100), paper("2601.00002", 90), paper("2601.00003", 80)];
  const seeds: OfficialLabSeed[] = [
    {
      lab: "MiniMax",
      arxivId: "2601.99999v2",
      officialEvidenceUrl: "https://www.minimax.io/research/example",
    },
  ];
  const selected = selectCorpus(daily, seeds, 3);
  assert.deepEqual(selected.map((entry) => entry.arxivId), [
    "2601.00001",
    "2601.00002",
    "2601.99999",
  ]);
  assert.equal(selected.at(-1)?.officialLab, "MiniMax");
  assert.deepEqual(selected.at(-1)?.selectionReasons, ["official-lab"]);
});

test("deduplicates arXiv versions and uses a stable id tie-breaker", () => {
  const selected = selectCorpus(
    [paper("2601.00002v1", 10), paper("2601.00001", 10), paper("2601.00002v2", 12)],
    [],
    2,
  );
  assert.deepEqual(selected.map((entry) => entry.arxivId), ["2601.00002", "2601.00001"]);
});

test("parses versioned arXiv metadata", () => {
  const xml = `<?xml version="1.0"?><feed xmlns:arxiv="http://arxiv.org/schemas/atom"><entry><id>http://arxiv.org/abs/2607.24653v2</id><title>Kimi K3\n report</title><updated>2026-08-01T00:00:00Z</updated><published>2026-07-27T00:00:00Z</published><summary>Full\n abstract</summary><link href="https://arxiv.org/abs/2607.24653v2" rel="alternate" type="text/html"/><link href="https://arxiv.org/pdf/2607.24653v2" rel="related" type="application/pdf"/><category term="cs.CL"/><category term="cs.LG"/><arxiv:primary_category term="cs.CL"/><author><name>Kimi Team</name></author></entry></feed>`;
  const [metadata] = parseArxivFeed(xml);
  assert.equal(metadata?.arxivId, "2607.24653");
  assert.equal(metadata?.versionedArxivId, "2607.24653v2");
  assert.deepEqual(metadata?.categories, ["cs.CL", "cs.LG"]);
  assert.deepEqual(metadata?.authors, ["Kimi Team"]);
  assert.equal(metadata?.title, "Kimi K3 report");
});

test("normalizes versioned and URL arXiv identifiers", () => {
  assert.equal(canonicalArxivId("https://arxiv.org/abs/2607.24653v3"), "2607.24653");
});

test("uses the arXiv v1 publication timestamp for an inclusive corpus window", () => {
  assert.equal(isPublishedInCorpusWindow("2025-08-04T00:00:00Z"), true);
  assert.equal(isPublishedInCorpusWindow("2026-08-04T23:59:59Z"), true);
  assert.equal(isPublishedInCorpusWindow("2025-08-03T23:59:59Z"), false);
  assert.equal(isPublishedInCorpusWindow("2026-08-05T00:00:00Z"), false);
  assert.equal(isPublishedInCorpusWindow("not-a-date"), false);
});
