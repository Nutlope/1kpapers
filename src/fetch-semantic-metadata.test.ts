import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSourceArxivIds,
  fetchSemanticScholarSnapshot,
  MAX_BATCH_SIZE,
  splitIntoBatches,
} from "./fetch-semantic-metadata.js";

test("builds 1,018 deterministic unique source identifiers", () => {
  const corpus = {
    papers: Array.from({ length: 1_000 }, (_, index) => ({
      arxivId: `2501.${String(index).padStart(5, "0")}v2`,
    })),
  };
  const supplemental: Array<{ arxivId?: string; landingPage?: string }> = Array.from(
    { length: 17 },
    (_, index) => ({
      arxivId: `2601.${String(index).padStart(5, "0")}`,
    }),
  );
  supplemental.push({
    landingPage: "https://www.alphaxiv.org/abs/2606.parallel-kernel-bench",
  });

  const ids = buildSourceArxivIds(corpus, supplemental);
  assert.equal(ids.length, 1_018);
  assert.equal(new Set(ids).size, 1_018);
  assert.equal(ids[0], "2501.00000");
  assert.equal(ids.at(-1), "2606.parallel-kernel-bench");
});

test("splits requests into batches of at most 500", () => {
  const batches = splitIntoBatches(Array.from({ length: 1_018 }, (_, index) => index));
  assert.deepEqual(batches.map((batch) => batch.length), [MAX_BATCH_SIZE, MAX_BATCH_SIZE, 18]);
});

test("retries rate limits and preserves response order with explicit nulls", async () => {
  const requestedBodies: string[] = [];
  const sleepDurations: number[] = [];
  let calls = 0;
  const fetchImpl: typeof fetch = async (_input, init) => {
    calls += 1;
    requestedBodies.push(String(init?.body));
    if (calls === 1) {
      return new Response("rate limited", { status: 429 });
    }
    return Response.json([
      {
        paperId: "paper-2",
        title: "Second",
        authors: [],
        abstract: null,
        externalIds: { ArXiv: "2601.00002" },
        citationCount: 0,
        venue: "",
        publicationVenue: null,
        publicationDate: null,
        openAccessPdf: null,
      },
      null,
    ]);
  };

  const snapshot = await fetchSemanticScholarSnapshot(
    ["2601.00002", "2601.00001"],
    {
      fetchImpl,
      sleep: async (milliseconds) => {
        sleepDurations.push(milliseconds);
      },
      maxAttempts: 2,
      initialBackoffMs: 25,
      betweenBatchDelayMs: 0,
      now: () => new Date("2026-08-06T00:00:00.000Z"),
    },
  );

  assert.equal(calls, 2);
  assert.deepEqual(sleepDurations, [25]);
  assert.equal(requestedBodies[0], '{"ids":["ARXIV:2601.00002","ARXIV:2601.00001"]}');
  assert.deepEqual(snapshot.records.map((record) => record.arxivId), [
    "2601.00002",
    "2601.00001",
  ]);
  assert.equal(snapshot.records[0]?.paper?.citationCount, 0);
  assert.equal(snapshot.records[1]?.paper, null);
  assert.equal(snapshot.matchedCount, 1);
  assert.equal(snapshot.unmatchedCount, 1);
  assert.equal(snapshot.retrievedAt, "2026-08-06T00:00:00.000Z");
});
