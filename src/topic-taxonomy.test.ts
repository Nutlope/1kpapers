import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { openDerivedDatabase } from "./derived-database.js";
import { renderSiteTaxonomy } from "./generate-site-taxonomy.js";
import { TOPIC_SECTIONS, TOPIC_SLUGS, TOPIC_TAXONOMY, topicsInSection } from "./topic-taxonomy.js";

const derivedDatabasePath = path.join(process.cwd(), "data", "derived.sqlite");

describe("topic taxonomy", () => {
  it("exposes eight balanced topic areas for the site index", () => {
    assert.equal(TOPIC_SECTIONS.length, 8);
    assert.deepEqual(
      topicsInSection("video-spatial").map((topic) => topic.slug),
      ["video-generation", "video-understanding", "spatial-3d"],
    );
  });

  it("has unique slugs and a known section for every topic", () => {
    assert.equal(new Set(TOPIC_SLUGS).size, TOPIC_SLUGS.length);
    const sectionSlugs = new Set(TOPIC_SECTIONS.map((section) => section.slug));
    for (const topic of TOPIC_TAXONOMY) {
      assert.ok(sectionSlugs.has(topic.section), `${topic.slug} has unknown section ${topic.section}`);
      assert.ok(topic.description.length > 40, `${topic.slug} needs a usable description`);
    }
  });

  it("leaves no section empty", () => {
    for (const section of TOPIC_SECTIONS) {
      assert.ok(topicsInSection(section.slug).length > 0, `section ${section.slug} has no topics`);
    }
  });

  it("keeps the generated site copy in sync", () => {
    const generatedPath = path.join(process.cwd(), "site", "lib", "topic-taxonomy.ts");
    assert.equal(
      readFileSync(generatedPath, "utf8"),
      renderSiteTaxonomy(),
      "site/lib/topic-taxonomy.ts is stale — run `pnpm topics:sync`",
    );
  });
});

/**
 * The balance criteria are the whole point of the taxonomy rework: a shelf
 * holding half the corpus is a filter, not a shelf. These assertions fail
 * loudly if a future classifier run regresses toward one dominant bucket.
 */
describe("topic assignment balance", { skip: !existsSync(derivedDatabasePath) }, () => {
  const database = openDerivedDatabase(derivedDatabasePath);
  const rows = database.prepare(
    "SELECT topicSlug, COUNT(*) AS n FROM paper_topics WHERE rank = 1 GROUP BY topicSlug ORDER BY n DESC",
  ).all() as Array<{ topicSlug: string; n: number }>;
  const total = rows.reduce((sum, row) => sum + row.n, 0);
  database.close();

  it("assigns exactly one primary topic per classified paper", { skip: total === 0 }, () => {
    const database = openDerivedDatabase(derivedDatabasePath);
    const duplicates = database.prepare(
      "SELECT collectionId, COUNT(*) AS n FROM paper_topics WHERE rank = 1 GROUP BY collectionId HAVING n > 1",
    ).all() as Array<{ collectionId: string }>;
    database.close();
    assert.deepEqual(duplicates, []);
  });

  it("keeps the largest topic under 20% of the corpus", { skip: total === 0 }, () => {
    const largest = rows[0]!;
    const share = (largest.n / total) * 100;
    assert.ok(share < 20, `${largest.topicSlug} holds ${share.toFixed(1)}% of papers (limit 20%)`);
  });

  /**
   * The floor is 8 rather than a rounder number because `science-medicine`
   * genuinely holds 8 papers: this is a popularity-weighted Hugging Face Daily
   * Papers corpus, and medical AI does not trend there. That is a fact about
   * the corpus worth surfacing, not a classification error worth merging away.
   *
   * Note there is deliberately no largest/smallest ratio assertion. An earlier
   * draft targeted 8x; real topic distributions are power-law shaped (this one
   * is 17x) and no honest taxonomy over this corpus would meet it.
   */
  it("keeps every topic above a usable shelf size", { skip: total === 0 }, () => {
    const undersized = rows.filter((row) => row.n < 8).map((row) => `${row.topicSlug} (${row.n})`);
    assert.deepEqual(undersized, [], `undersized shelves: ${undersized.join(", ")}`);
  });

  it("assigns every classified paper a topic in the current vocabulary", { skip: total === 0 }, () => {
    const unknown = rows.filter((row) => !TOPIC_SLUGS.includes(row.topicSlug)).map((row) => row.topicSlug);
    assert.deepEqual(unknown, []);
  });
});
