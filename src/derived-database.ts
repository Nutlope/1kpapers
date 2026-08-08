import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

/**
 * Derived and editorial data lives in its own database so that rebuilding
 * `papers.sqlite` from `metadata/papers.json` — or re-downloading it with
 * `data:pull` — can never destroy it.
 */
export function openDerivedDatabase(databasePath: string) {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  // NORMAL is the standard durability setting for WAL: safe against process
  // crashes, and it avoids an fsync on every commit during bulk classification.
  // NORMAL durability is standard for WAL and avoids an fsync per commit during
  // bulk writes; busy_timeout lets two classifier processes (one per model)
  // share the file instead of failing on SQLITE_BUSY.
  database.exec(
    "PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL; PRAGMA busy_timeout = 15000; PRAGMA foreign_keys = ON;",
  );
  database.exec(`
    CREATE TABLE IF NOT EXISTS embeddings (
      collectionId TEXT PRIMARY KEY,
      model        TEXT NOT NULL,
      dimensions   INTEGER NOT NULL,
      inputHash    TEXT NOT NULL,
      vector       BLOB NOT NULL,
      createdAt    TEXT NOT NULL
    );
  `);
  database.exec("CREATE INDEX IF NOT EXISTS embeddings_model_idx ON embeddings (model);");
  database.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      slug        TEXT PRIMARY KEY,
      label       TEXT NOT NULL,
      description TEXT NOT NULL,
      sortOrder   INTEGER NOT NULL
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS paper_topics (
      collectionId TEXT NOT NULL,
      topicSlug    TEXT NOT NULL REFERENCES topics(slug),
      rank         INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
      source       TEXT NOT NULL CHECK (source IN ('model', 'human')),
      confidence   REAL,
      model        TEXT,
      assignedAt   TEXT NOT NULL,
      PRIMARY KEY (collectionId, topicSlug)
    );
  `);
  // A paper may hold at most one primary topic; this is the constraint that
  // keeps a broad label from absorbing the corpus.
  database.exec(
    "CREATE UNIQUE INDEX IF NOT EXISTS paper_topics_primary_idx ON paper_topics (collectionId) WHERE rank = 1;",
  );
  database.exec("CREATE INDEX IF NOT EXISTS paper_topics_slug_idx ON paper_topics (topicSlug, rank);");
  // Raw per-model output is kept separately from the resolved assignment so two
  // models can be compared, and so re-resolving never needs a re-run.
  database.exec(`
    CREATE TABLE IF NOT EXISTS topic_predictions (
      collectionId TEXT NOT NULL,
      model        TEXT NOT NULL,
      topicSlug    TEXT NOT NULL REFERENCES topics(slug),
      rank         INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
      confidence   REAL,
      createdAt    TEXT NOT NULL,
      PRIMARY KEY (collectionId, model, topicSlug)
    );
  `);
  database.exec("CREATE INDEX IF NOT EXISTS topic_predictions_model_idx ON topic_predictions (model, collectionId);");
  return database;
}

/** Seeds the closed vocabulary so the paper_topics foreign key can enforce it. */
export function syncTopicVocabulary(
  database: ReturnType<typeof openDerivedDatabase>,
  taxonomy: Array<{ slug: string; label: string; description: string }>,
) {
  const upsert = database.prepare(`
    INSERT INTO topics (slug, label, description, sortOrder) VALUES (?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      label = excluded.label, description = excluded.description, sortOrder = excluded.sortOrder
  `);
  database.exec("BEGIN");
  try {
    for (const [index, topic] of taxonomy.entries()) {
      upsert.run(topic.slug, topic.label, topic.description, index);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function encodeVector(values: number[]) {
  return new Uint8Array(Float32Array.from(values).buffer);
}

export function decodeVector(blob: Uint8Array) {
  const copy = new Uint8Array(blob);
  return new Float32Array(copy.buffer, copy.byteOffset, copy.byteLength / Float32Array.BYTES_PER_ELEMENT);
}
