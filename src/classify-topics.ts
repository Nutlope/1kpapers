import path from "node:path";
import { openDerivedDatabase, syncTopicVocabulary } from "./derived-database.js";
import { readPaperDatabase } from "./paper-database.js";
import { canonicalTopicSlug, isTopicSlug, taxonomyPromptBlock, TOPIC_SLUGS, TOPIC_TAXONOMY } from "./topic-taxonomy.js";

type ClassifiablePaper = {
  collectionId: string;
  title: string;
  abstract: string;
  summary: string;
  arxivCategories: string[];
};

type Prediction = { primary: string; secondary: string[]; confidence: number };

const ENDPOINT = "https://api.together.xyz/v1/chat/completions";
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 1_000;
/**
 * Together's tail latency grows sharply with concurrency: a request that takes
 * ~2s alone can take 30s+ with many in flight. The timeout must sit above that
 * tail, or genuine stragglers get cancelled and retried three times, which is
 * far more expensive than simply waiting for them.
 */
const REQUEST_TIMEOUT_MS = Number(process.env.CLASSIFY_TIMEOUT_MS ?? 90_000);
const MAX_SUMMARY_CHARACTERS = 2_400;

const projectRoot = process.cwd();
const databasePath = path.join(projectRoot, "data", "papers.sqlite");
const derivedDatabasePath = path.join(projectRoot, "data", "derived.sqlite");

const args = process.argv.slice(2);
const concurrency = Number(readFlag("concurrency") ?? 12);
const limit = Number(readFlag("limit") ?? 0);
const models = (readFlag("models") ?? "deepseek-ai/DeepSeek-V4-Flash-0731,Qwen/Qwen3.5-9B").split(",");
/** The model whose primary wins when the two disagree. */
const primaryModel = readFlag("primary-model") ?? models[0]!;

function readFlag(name: string) {
  return args.find((argument) => argument.startsWith(`--${name}=`))?.slice(name.length + 3);
}

const SYSTEM_PROMPT = `You are a research librarian shelving AI papers into a fixed collection.

Choose the ONE topic the paper is fundamentally about — the shelf a reader looking for this work would browse. Then add up to two secondary topics that a reader might also browse for.

Rules:
- Judge what the paper CONTRIBUTES, not what it mentions. Ignore topics that merely appear as evaluation benchmarks, baselines, related work, or motivation.
- A paper that trains a model with reinforcement learning is only "rl-for-reasoning" if the RL method is the contribution.
- A benchmark, dataset, or evaluation paper belongs to the topic it evaluates, not to a generic evaluation shelf.
- arXiv categories are a hint, not the answer: cs.AI and cs.LG are catch-alls, but cs.CV, cs.RO, cs.CL, cs.SE and cs.SD are informative.
- Secondary topics are optional. Return an empty list rather than padding.
- confidence is your certainty in the primary topic, from 0 to 1.

Available topics:
${taxonomyPromptBlock()}`;

const RESPONSE_FORMAT = {
  type: "json_schema",
  json_schema: {
    name: "paper_topics",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["primary", "secondary", "confidence"],
      properties: {
        primary: { type: "string", enum: TOPIC_SLUGS },
        secondary: { type: "array", maxItems: 2, items: { type: "string", enum: TOPIC_SLUGS } },
        confidence: { type: "number" },
      },
    },
  },
} as const;

function userPrompt(paper: ClassifiablePaper) {
  const categories = paper.arxivCategories.length > 0 ? paper.arxivCategories.join(", ") : "unknown";
  const body = (paper.summary || paper.abstract).slice(0, MAX_SUMMARY_CHARACTERS);
  return `Title: ${paper.title}\narXiv categories: ${categories}\n\nSummary:\n${body}`;
}

async function classify(paper: ClassifiablePaper, model: string, apiKey: string): Promise<Prediction & { tokens: { input: number; output: number } }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 200,
          // Matches the benchmark's contract: no hidden reasoning tokens, which
          // otherwise blow past max_tokens and return empty content.
          reasoning: { enabled: false },
          response_format: RESPONSE_FORMAT,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt(paper) },
          ],
        }),
        // A classification that normally takes ~2s is a straggler at 20s;
        // abandoning and retrying beats waiting on a stuck lane.
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 200)}`);
      const payload = await response.json() as {
        choices: Array<{ message: { content: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const parsed = JSON.parse(payload.choices[0]!.message.content) as Prediction;
      if (!isTopicSlug(parsed.primary)) throw new Error(`Unknown primary topic ${parsed.primary}`);
      const secondary = (parsed.secondary ?? [])
        .filter((slug) => isTopicSlug(slug) && slug !== parsed.primary)
        .slice(0, 2);
      return {
        primary: parsed.primary,
        secondary,
        confidence: Number.isFinite(parsed.confidence) ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
        tokens: {
          input: payload.usage?.prompt_tokens ?? 0,
          output: payload.usage?.completion_tokens ?? 0,
        },
      };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_MS * attempt));
    }
  }
  throw lastError;
}

/** Runs `worker` over `items` with a bounded number of in-flight requests. */
async function pool<T>(items: T[], size: number, worker: (item: T, index: number) => Promise<void>) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      await worker(items[index]!, index);
    }
  });
  await Promise.all(runners);
}

const apiKey = process.env.TOGETHER_API_KEY;
if (!apiKey) throw new Error("Missing TOGETHER_API_KEY");

const dataset = readPaperDatabase(databasePath);
const allPapers: ClassifiablePaper[] = dataset.papers.map((paper) => ({
  collectionId: String(paper.collectionId),
  title: String(paper.title),
  abstract: String(paper.abstract ?? ""),
  summary: String(paper.summary ?? ""),
  arxivCategories: (paper.arxivCategories ?? []) as string[],
}));
const papers = limit > 0 ? allPapers.slice(0, limit) : allPapers;

const database = openDerivedDatabase(derivedDatabasePath);
syncTopicVocabulary(database, TOPIC_TAXONOMY);

const insertPrediction = database.prepare(`
  INSERT INTO topic_predictions (collectionId, model, topicSlug, rank, confidence, createdAt)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(collectionId, model, topicSlug) DO UPDATE SET
    rank = excluded.rank, confidence = excluded.confidence, createdAt = excluded.createdAt
`);
const clearPredictions = database.prepare("DELETE FROM topic_predictions WHERE collectionId = ? AND model = ?");

for (const model of models) {
  const done = new Set(
    (database.prepare("SELECT DISTINCT collectionId FROM topic_predictions WHERE model = ?").all(model) as Array<{ collectionId: string }>)
      .map((row) => row.collectionId),
  );
  const todo = papers.filter((paper) => !done.has(paper.collectionId));
  process.stdout.write(`\n${model}: ${todo.length} to classify (${done.size} already stored)\n`);

  let completed = 0;
  let failed = 0;
  const failureReasons = new Map<string, number>();
  const tokens = { input: 0, output: 0 };
  await pool(todo, concurrency, async (paper) => {
    try {
      const prediction = await classify(paper, model, apiKey);
      tokens.input += prediction.tokens.input;
      tokens.output += prediction.tokens.output;
      const createdAt = new Date().toISOString();
      // One transaction per paper: DatabaseSync blocks the event loop on every
      // commit, so four autocommitted writes per paper starve the request pool.
      database.exec("BEGIN IMMEDIATE");
      try {
        clearPredictions.run(paper.collectionId, model);
        insertPrediction.run(paper.collectionId, model, prediction.primary, 1, prediction.confidence, createdAt);
        prediction.secondary.forEach((slug, offset) => {
          insertPrediction.run(paper.collectionId, model, slug, offset + 2, null, createdAt);
        });
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    } catch (error) {
      failed += 1;
      const reason = error instanceof Error ? `${error.name}: ${error.message.slice(0, 60)}` : "unknown";
      failureReasons.set(reason, (failureReasons.get(reason) ?? 0) + 1);
    }
    completed += 1;
    if (completed % 25 === 0 || completed === todo.length) {
      process.stdout.write(`  ${completed}/${todo.length} (${failed} failed)\r`);
    }
  });
  process.stdout.write(`\n  tokens in ${tokens.input.toLocaleString()}, out ${tokens.output.toLocaleString()}, failed ${failed}\n`);
  for (const [reason, count] of [...failureReasons].sort((left, right) => right[1] - left[1])) {
    process.stdout.write(`    ${count}x ${reason}\n`);
  }
}

database.close();
process.stdout.write("\nClassification stored in topic_predictions. Run `pnpm topics:resolve` next.\n");
