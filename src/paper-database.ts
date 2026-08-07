import { mkdirSync, renameSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

export type PaperDataset = {
  schemaVersion: number;
  generatedAt: string;
  paperCount: number;
  sources: Record<string, unknown>;
  papers: Array<Record<string, unknown>>;
};

const ARRAY_COLUMNS = new Set(["authors", "topicTags", "arxivCategories"]);
const INTEGER_COLUMNS = new Set([
  "benchmarkRank",
  "pageCount",
  "extractedCharacters",
  "hfUpvotes",
  "summaryMethodologyVersion",
  "citationCount",
  "githubStars",
]);
const REQUIRED_COLUMNS = new Set([
  "collectionId",
  "title",
  "authors",
  "publishedAt",
  "landingUrl",
  "sourceCollection",
  "topicTags",
  "arxivCategories",
  "summary",
]);

export function createPaperDatabase(
  dataset: PaperDataset,
  databasePath: string,
  options: { overwrite?: boolean } = {},
) {
  if (dataset.papers.length === 0) throw new Error("Cannot create a paper database without papers");
  const columns = Object.keys(dataset.papers[0]!);
  validateColumns(dataset.papers, columns);

  mkdirSync(dirname(databasePath), { recursive: true });
  const temporaryPath = `${databasePath}.tmp-${process.pid}`;
  rmSync(temporaryPath, { force: true });
  if (options.overwrite) rmSync(databasePath, { force: true });

  const database = new DatabaseSync(temporaryPath);
  try {
    database.exec("PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON;");
    database.exec(`
      CREATE TABLE dataset_metadata (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL CHECK (json_valid(value_json))
      );
    `);

    const declarations = columns.map((column) => {
      const type = INTEGER_COLUMNS.has(column) ? "INTEGER" : "TEXT";
      const required = REQUIRED_COLUMNS.has(column) ? " NOT NULL" : "";
      const primary = column === "collectionId" ? " PRIMARY KEY" : "";
      const jsonCheck = ARRAY_COLUMNS.has(column)
        ? ` CHECK (json_valid(${quoteIdentifier(column)}) AND json_type(${quoteIdentifier(column)}) = 'array')`
        : "";
      return `${quoteIdentifier(column)} ${type}${required}${primary}${jsonCheck}`;
    });
    database.exec(`CREATE TABLE papers (_dataset_order INTEGER NOT NULL UNIQUE, ${declarations.join(", ")});`);

    const metadataStatement = database.prepare("INSERT INTO dataset_metadata (key, value_json) VALUES (?, ?)");
    const paperStatement = database.prepare(
      `INSERT INTO papers (_dataset_order, ${columns.map(quoteIdentifier).join(", ")}) VALUES (${columns.map(() => "?").concat("?").join(", ")})`,
    );

    database.exec("BEGIN IMMEDIATE");
    try {
      for (const [key, value] of Object.entries({
        schemaVersion: dataset.schemaVersion,
        generatedAt: dataset.generatedAt,
        paperCount: dataset.papers.length,
        sources: dataset.sources,
      })) {
        metadataStatement.run(key, JSON.stringify(value));
      }
      dataset.papers.forEach((paper, index) => {
        const values = columns.map((column) => toSqlValue(column, paper[column]));
        paperStatement.run(index, ...values);
      });
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }

    for (const column of ["publishedAt", "officialLab", "sourceCollection", "citationCount"]) {
      if (columns.includes(column)) {
        database.exec(`CREATE INDEX ${quoteIdentifier(`papers_${column}_idx`)} ON papers (${quoteIdentifier(column)});`);
      }
    }
    database.exec("PRAGMA user_version = 1; VACUUM;");
    assertIntegrity(database, dataset.papers.length);
  } finally {
    database.close();
  }

  if (!options.overwrite) {
    try {
      const existing = new DatabaseSync(databasePath, { readOnly: true });
      existing.close();
      rmSync(temporaryPath, { force: true });
      throw new Error(`Database already exists: ${databasePath}. Pass --force to replace it.`);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Database already exists:")) throw error;
    }
  }
  renameSync(temporaryPath, databasePath);
}

export function readPaperDatabase(databasePath: string): PaperDataset {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const metadataRows = database.prepare("SELECT key, value_json FROM dataset_metadata").all() as Array<{
      key: string;
      value_json: string;
    }>;
    const metadata = Object.fromEntries(metadataRows.map((row) => [row.key, JSON.parse(row.value_json)]));
    const rows = database.prepare("SELECT * FROM papers ORDER BY _dataset_order").all() as Array<Record<string, SQLInputValue>>;
    const papers = rows.map((row) => Object.fromEntries(
      Object.entries(row)
        .filter(([key]) => key !== "_dataset_order")
        .map(([key, value]) => [key, ARRAY_COLUMNS.has(key) && typeof value === "string" ? JSON.parse(value) : value]),
    ));
    assertIntegrity(database, papers.length);
    return {
      schemaVersion: Number(metadata.schemaVersion),
      generatedAt: String(metadata.generatedAt),
      paperCount: papers.length,
      sources: metadata.sources as Record<string, unknown>,
      papers,
    };
  } finally {
    database.close();
  }
}

export function updatePaperDatabaseGeneratedAt(databasePath: string, generatedAt: string) {
  const database = new DatabaseSync(databasePath);
  try {
    database.prepare("UPDATE dataset_metadata SET value_json = ? WHERE key = 'generatedAt'").run(JSON.stringify(generatedAt));
    database.prepare("UPDATE dataset_metadata SET value_json = (SELECT json(count(*)) FROM papers) WHERE key = 'paperCount'").run();
    assertIntegrity(database);
  } finally {
    database.close();
  }
}

export function validatePaperDatabase(databasePath: string, expectedCount?: number) {
  const database = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const count = Number((database.prepare("SELECT count(*) AS count FROM papers").get() as { count: number }).count);
    assertIntegrity(database, expectedCount ?? count);
    return { count, userVersion: Number((database.prepare("PRAGMA user_version").get() as { user_version: number }).user_version) };
  } finally {
    database.close();
  }
}

function validateColumns(papers: Array<Record<string, unknown>>, columns: string[]) {
  if (!columns.includes("collectionId")) throw new Error("Paper records require collectionId");
  const expected = [...columns].sort().join("\0");
  for (const paper of papers) {
    const actual = Object.keys(paper).sort().join("\0");
    if (actual !== expected) throw new Error(`Paper ${String(paper.collectionId)} does not match the database schema`);
  }
}

function toSqlValue(column: string, value: unknown): SQLInputValue {
  if (value === null || value === undefined) return null;
  if (ARRAY_COLUMNS.has(column)) return JSON.stringify(value);
  if (INTEGER_COLUMNS.has(column)) {
    if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`${column} must be a safe integer or null`);
    return value;
  }
  if (typeof value !== "string") throw new Error(`${column} must be a string or null`);
  return value;
}

function assertIntegrity(database: DatabaseSync, expectedCount?: number) {
  const result = database.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
  if (result.integrity_check !== "ok") throw new Error(`SQLite integrity check failed: ${result.integrity_check}`);
  if (expectedCount !== undefined) {
    const count = Number((database.prepare("SELECT count(*) AS count FROM papers").get() as { count: number }).count);
    if (count !== expectedCount) throw new Error(`Expected ${expectedCount} papers in SQLite, found ${count}`);
  }
}

function quoteIdentifier(value: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error(`Unsafe SQLite identifier: ${value}`);
  return `"${value}"`;
}
