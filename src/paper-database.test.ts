import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { describe, it } from "node:test";
import {
  createPaperDatabase,
  readPaperDatabase,
  updatePaperDatabaseGeneratedAt,
  validatePaperDatabase,
  type PaperDataset,
} from "./paper-database.js";

const dataset: PaperDataset = {
  schemaVersion: 1,
  generatedAt: "2026-08-07T00:00:00Z",
  paperCount: 2,
  sources: { test: "fixture" },
  papers: [
    paper("paper-one", "First paper", 2),
    paper("paper-two", "Second paper", 10),
  ],
};

describe("canonical paper database", () => {
  it("round trips records and supports bulk SQL edits", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "smartpdfs-db-"));
    const databasePath = path.join(directory, "papers.sqlite");
    try {
      createPaperDatabase(dataset, databasePath);
      const database = new DatabaseSync(databasePath);
      database.prepare("UPDATE papers SET officialLab = ? WHERE citationCount < ?").run("Together AI", 5);
      database.close();
      updatePaperDatabaseGeneratedAt(databasePath, "2026-08-07T12:00:00Z");

      const result = readPaperDatabase(databasePath);
      assert.equal(result.paperCount, 2);
      assert.equal(result.generatedAt, "2026-08-07T12:00:00Z");
      assert.deepEqual(result.papers[0]?.authors, ["Researcher"]);
      assert.equal(result.papers[0]?.officialLab, "Together AI");
      assert.equal(result.papers[1]?.officialLab, null);
      assert.deepEqual(validatePaperDatabase(databasePath), { count: 2, userVersion: 1 });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

function paper(collectionId: string, title: string, citationCount: number) {
  return {
    collectionId,
    title,
    authors: ["Researcher"],
    abstract: null,
    publishedAt: "2026-01-01T00:00:00Z",
    landingUrl: `https://example.com/${collectionId}`,
    sourceCollection: "benchmark-1000",
    topicTags: ["systems-efficiency"],
    arxivCategories: ["cs.LG"],
    summary: "Summary",
    officialLab: null,
    citationCount,
  };
}
