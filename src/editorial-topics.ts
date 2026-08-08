import { existsSync } from "node:fs";
import { openDerivedDatabase } from "./derived-database.js";

export type EditorialAssignment = { primary: string; secondary: string[] };

/**
 * Reads resolved editorial topics from the derived database.
 *
 * These are produced by `pnpm topics:classify` + `pnpm topics:resolve` and are
 * the single source of truth for topic membership — the site no longer derives
 * topics from keyword matching at build or request time.
 */
export function readEditorialTopics(databasePath: string): Map<string, EditorialAssignment> {
  const assignments = new Map<string, EditorialAssignment>();
  if (!existsSync(databasePath)) return assignments;

  const database = openDerivedDatabase(databasePath);
  try {
    const rows = database.prepare(
      "SELECT collectionId, topicSlug, rank FROM paper_topics ORDER BY collectionId, rank",
    ).all() as Array<{ collectionId: string; topicSlug: string; rank: number }>;

    for (const row of rows) {
      const entry = assignments.get(row.collectionId) ?? { primary: "", secondary: [] };
      if (row.rank === 1) entry.primary = row.topicSlug;
      else entry.secondary.push(row.topicSlug);
      assignments.set(row.collectionId, entry);
    }
    return assignments;
  } finally {
    database.close();
  }
}

/** Primary first, then secondary — the order the site renders them in. */
export function assignmentToList(assignment: EditorialAssignment | undefined): string[] {
  if (!assignment) return [];
  return assignment.primary ? [assignment.primary, ...assignment.secondary] : assignment.secondary;
}
