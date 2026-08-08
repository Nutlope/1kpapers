import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { openDerivedDatabase, syncTopicVocabulary } from "./derived-database.js";
import { readPaperDatabase } from "./paper-database.js";
import { canonicalTopicSlug, TOPIC_TAXONOMY } from "./topic-taxonomy.js";

/**
 * Turns raw per-model predictions into one resolved assignment per paper.
 *
 * Human assignments are never overwritten. Where the two models agree on the
 * primary topic the result is trusted; where they disagree the paper is written
 * with a reduced confidence and listed in the review queue, because
 * inter-model disagreement is a far better ambiguity signal than a model's own
 * self-reported confidence.
 */
const projectRoot = process.cwd();
const derivedDatabasePath = path.join(projectRoot, "data", "derived.sqlite");
const databasePath = path.join(projectRoot, "data", "papers.sqlite");

const args = process.argv.slice(2);
const primaryModel = args.find((argument) => argument.startsWith("--primary-model="))?.slice(16)
  ?? "deepseek-ai/DeepSeek-V4-Flash-0731";

const database = openDerivedDatabase(derivedDatabasePath);
syncTopicVocabulary(database, TOPIC_TAXONOMY);

const models = (database.prepare("SELECT DISTINCT model FROM topic_predictions ORDER BY model").all() as Array<{ model: string }>)
  .map((row) => row.model);
if (models.length === 0) throw new Error("No predictions found — run `pnpm topics:classify` first");

type PredictionRow = { collectionId: string; model: string; topicSlug: string; rank: number; confidence: number | null };
const rows = database.prepare("SELECT collectionId, model, topicSlug, rank, confidence FROM topic_predictions").all() as PredictionRow[];

const byPaper = new Map<string, Map<string, { primary: string; secondary: string[]; confidence: number }>>();
for (const row of rows) {
  if (!byPaper.has(row.collectionId)) byPaper.set(row.collectionId, new Map());
  const perModel = byPaper.get(row.collectionId)!;
  const entry = perModel.get(row.model) ?? { primary: "", secondary: [], confidence: 0 };
  const topicSlug = canonicalTopicSlug(row.topicSlug);
  if (row.rank === 1) {
    entry.primary = topicSlug;
    entry.confidence = row.confidence ?? 0.5;
  } else {
    entry.secondary.push(topicSlug);
  }
  perModel.set(row.model, entry);
}

const humanPapers = new Set(
  (database.prepare("SELECT DISTINCT collectionId FROM paper_topics WHERE source = 'human'").all() as Array<{ collectionId: string }>)
    .map((row) => row.collectionId),
);

const insert = database.prepare(`
  INSERT INTO paper_topics (collectionId, topicSlug, rank, source, confidence, model, assignedAt)
  VALUES (?, ?, ?, 'model', ?, ?, ?)
`);
const clearModelRows = database.prepare("DELETE FROM paper_topics WHERE collectionId = ? AND source = 'model'");

const disagreements: Array<{ collectionId: string; picks: string[] }> = [];
let agreed = 0;
let resolved = 0;
const assignedAt = new Date().toISOString();

database.exec("BEGIN");
try {
  for (const [collectionId, perModel] of byPaper) {
    if (humanPapers.has(collectionId)) continue;
    const chosen = perModel.get(primaryModel) ?? [...perModel.values()][0];
    if (!chosen?.primary) continue;

    const primaries = [...perModel.values()].map((entry) => entry.primary);
    const unanimous = primaries.every((slug) => slug === primaries[0]);
    if (perModel.size > 1) {
      if (unanimous) agreed += 1;
      else disagreements.push({ collectionId, picks: [...perModel].map(([model, entry]) => `${model.split("/").pop()}:${entry.primary}`) });
    }

    // Agreement raises confidence; disagreement caps it so the paper surfaces for review.
    const confidence = perModel.size > 1
      ? (unanimous ? Math.min(1, chosen.confidence + 0.1) : Math.min(chosen.confidence, 0.45))
      : chosen.confidence;

    clearModelRows.run(collectionId);
    insert.run(collectionId, chosen.primary, 1, confidence, primaryModel, assignedAt);
    // Retiring a slug can collapse two secondaries onto the same topic, or onto
    // the primary, so dedupe after canonicalisation.
    const secondary = [...new Set(chosen.secondary)].filter((slug) => slug !== chosen.primary).slice(0, 2);
    secondary.forEach((slug, offset) => {
      insert.run(collectionId, slug, offset + 2, null, primaryModel, assignedAt);
    });
    resolved += 1;
  }
  database.exec("COMMIT");
} catch (error) {
  database.exec("ROLLBACK");
  throw error;
}

const distribution = database.prepare(`
  SELECT t.slug, t.label, COUNT(pt.collectionId) AS n
  FROM topics t LEFT JOIN paper_topics pt ON pt.topicSlug = t.slug AND pt.rank = 1
  GROUP BY t.slug ORDER BY n DESC
`).all() as Array<{ slug: string; label: string; n: number }>;

const total = (database.prepare("SELECT COUNT(*) AS n FROM paper_topics WHERE rank = 1").get() as { n: number }).n;
const largest = distribution[0]?.n ?? 0;
const smallest = distribution.at(-1)?.n ?? 0;
const agreementRate = byPaper.size > 0 && models.length > 1 ? (agreed / byPaper.size) * 100 : 0;

process.stdout.write(`Models: ${models.join(", ")}\n`);
process.stdout.write(`Resolved ${resolved} papers (${humanPapers.size} human assignments preserved)\n`);
if (models.length > 1) {
  process.stdout.write(`Primary-topic agreement: ${agreed}/${byPaper.size} (${agreementRate.toFixed(1)}%)\n`);
}
process.stdout.write(`\nPrimary topic distribution (${total} papers):\n`);
for (const row of distribution) {
  const share = total > 0 ? (row.n / total) * 100 : 0;
  process.stdout.write(`  ${row.slug.padEnd(26)} ${String(row.n).padStart(4)}  ${share.toFixed(1)}%\n`);
}
process.stdout.write(`\nLargest ${largest} (${((largest / total) * 100).toFixed(1)}%), smallest ${smallest}, ratio ${(largest / Math.max(1, smallest)).toFixed(1)}x\n`);

// Review queue: disagreements first, since those are the genuinely ambiguous papers.
const dataset = readPaperDatabase(databasePath);
const titles = new Map(dataset.papers.map((paper) => [String(paper.collectionId), String(paper.title)]));
const lines = [
  "# Topic review queue",
  "",
  `${disagreements.length} papers where \`${models.join("\` and \`")}\` chose different primary topics.`,
  "",
  "Fix one by writing a `source = 'human'` row; re-running the classifier will never overwrite it.",
  "",
  ...disagreements.map(({ collectionId, picks }) => `- **${titles.get(collectionId) ?? collectionId}**  \n  ${picks.join("  vs  ")}`),
  "",
];
const reportPath = path.join(projectRoot, "research", "topic-review-queue.md");
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${lines.join("\n")}\n`);
process.stdout.write(`\nReview queue (${disagreements.length} papers) written to ${path.relative(projectRoot, reportPath)}\n`);

database.close();
