import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicationCollection,
  fetchPublicationRecords,
  normalizeTitle,
} from "./fetch-publication-metadata.js";

test("builds the deterministic 1,018-record publication collection", () => {
  const corpus = {
    papers: Array.from({ length: 1_000 }, (_, index) => ({
      arxivId: `2501.${String(index).padStart(5, "0")}v2`,
      title: `Core paper ${index}`,
    })),
  };
  const supplemental = Array.from({ length: 17 }, (_, index) => ({
    id: `arxiv-2601.${String(index).padStart(5, "0")}`,
    arxivId: `2601.${String(index).padStart(5, "0")}`,
    title: `Together paper ${index}`,
  }));
  supplemental.push({
    id: "openreview-parallel-kernel-bench",
    title: "ParallelKernelBench",
  } as (typeof supplemental)[number]);

  const records = buildPublicationCollection(corpus, supplemental);
  assert.equal(records.length, 1_018);
  assert.equal(records.filter((record) => record.arxivId).length, 1_017);
  assert.deepEqual(records[0], {
    collectionId: "arxiv-2501.00000",
    arxivId: "2501.00000",
    title: "Core paper 0",
  });
  assert.deepEqual(records.at(-1), {
    collectionId: "openreview-parallel-kernel-bench",
    arxivId: null,
    title: "ParallelKernelBench",
  });
});

test("normalizes only formatting differences for exact title matching", () => {
  assert.equal(
    normalizeTitle("Kitty: Accurate &amp; Efficient 2-bit KV Cache Quantization"),
    normalizeTitle("Kitty: Accurate & Efficient 2 bit KV Cache Quantization"),
  );
  assert.equal(normalizeTitle("V1: Parallel"), normalizeTitle("$V_1$: Parallel"));
  assert.notEqual(normalizeTitle("A different paper"), normalizeTitle("A paper"));
});

test("retries a 429 and rejects a conflicting DataCite title", async () => {
  let calls = 0;
  const sleeps: number[] = [];
  const fetchImpl: typeof fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response("limited", {
        status: 429,
        headers: { "retry-after": "0.01" },
      });
    }
    return Response.json({
      data: {
        id: "10.48550/arxiv.2601.00001",
        attributes: {
          titles: [{ title: "Another paper" }],
          rightsList: [{ rights: "Explicit license", rightsUri: "https://example.com/license" }],
        },
      },
    });
  };
  const records = await fetchPublicationRecords(
    [{ collectionId: "arxiv-2601.00001", arxivId: "2601.00001", title: "Expected paper" }],
    {
      fetchImpl,
      sleep: async (milliseconds) => { sleeps.push(milliseconds); },
      maxAttempts: 2,
      now: () => new Date("2026-08-06T00:00:00.000Z"),
    },
  );

  assert.equal(calls, 2);
  assert.deepEqual(sleeps, [10, 10]);
  assert.equal(records[0]?.datacite.status, "title-mismatch");
  assert.equal(records[0]?.datacite.matchedBy, null);
  assert.equal(records[0]?.datacite.rightsList.length, 0);
});
