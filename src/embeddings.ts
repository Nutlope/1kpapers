import { createHash } from "node:crypto";
import { decodeVector, encodeVector, openDerivedDatabase } from "./derived-database.js";

export const EMBEDDING_MODEL = "intfloat/multilingual-e5-large-instruct";
export const EMBEDDING_DIMENSIONS = 1_024;

const ENDPOINT = "https://api.together.xyz/v1/embeddings";
const INSTRUCTION = "Identify the primary research topic of the AI paper";
const MAX_INPUT_CHARACTERS = 1_600;
const BATCH_SIZE = 32;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 1_000;

export type EmbeddablePaper = { collectionId: string; title: string; summary: string };
export type EmbeddingUsage = { promptTokens: number; requests: number; cacheHits: number };

/**
 * e5-instruct models expect every text in a symmetric task to carry the same
 * instruction prefix, so clustering inputs stay comparable to one another.
 */
export function embeddingInput(title: string, summary: string) {
  const text = `${title.trim()}\n\n${summary.trim()}`.slice(0, MAX_INPUT_CHARACTERS);
  return `Instruct: ${INSTRUCTION}\nQuery: ${text}`;
}

export function inputHash(text: string) {
  return createHash("sha256").update(`${EMBEDDING_MODEL} ${text}`).digest("hex").slice(0, 32);
}

export function cosineSimilarity(left: Float64Array, right: Float64Array) {
  let dot = 0;
  for (let index = 0; index < left.length; index += 1) dot += left[index]! * right[index]!;
  return dot;
}

export function normalize(vector: ArrayLike<number>): Float64Array {
  const result = new Float64Array(vector.length);
  let sum = 0;
  for (let index = 0; index < vector.length; index += 1) sum += vector[index]! * vector[index]!;
  const magnitude = Math.sqrt(sum) || 1;
  for (let index = 0; index < vector.length; index += 1) result[index] = vector[index]! / magnitude;
  return result;
}

async function embedBatch(texts: string[], apiKey: string): Promise<{ embeddings: number[][]; promptTokens: number }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
      });
      if (!response.ok) throw new Error(`Embedding request failed: ${response.status} ${(await response.text()).slice(0, 200)}`);
      const payload = await response.json() as {
        data: Array<{ index: number; embedding: number[] }>;
        usage?: { prompt_tokens?: number };
      };
      if (payload.data.length !== texts.length) {
        throw new Error(`Expected ${texts.length} embeddings but received ${payload.data.length}`);
      }
      const ordered = [...payload.data].sort((left, right) => left.index - right.index);
      return {
        embeddings: ordered.map((entry) => entry.embedding),
        promptTokens: payload.usage?.prompt_tokens ?? 0,
      };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_MS * attempt));
    }
  }
  throw lastError;
}

/**
 * Embeds every paper, storing vectors in the derived database keyed by paper id
 * so they can be joined against `papers` and reused by classification and
 * related-paper ranking. A changed input hash re-embeds that paper only.
 *
 * Returned vectors are unit length, so a dot product is the cosine similarity.
 */
export async function embedPapers(
  papers: EmbeddablePaper[],
  options: { databasePath: string; onProgress?: (done: number, total: number) => void },
): Promise<{ vectors: Float64Array[]; usage: EmbeddingUsage }> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("Missing TOGETHER_API_KEY");

  const database = openDerivedDatabase(options.databasePath);
  try {
    const texts = papers.map((paper) => embeddingInput(paper.title, paper.summary));
    const hashes = texts.map(inputHash);

    const existing = new Map<string, { inputHash: string; vector: Uint8Array }>();
    const rows = database.prepare("SELECT collectionId, inputHash, vector FROM embeddings WHERE model = ?")
      .all(EMBEDDING_MODEL) as Array<{ collectionId: string; inputHash: string; vector: Uint8Array }>;
    for (const row of rows) existing.set(row.collectionId, { inputHash: row.inputHash, vector: row.vector });

    const pending: number[] = [];
    for (let index = 0; index < papers.length; index += 1) {
      if (existing.get(papers[index]!.collectionId)?.inputHash !== hashes[index]) pending.push(index);
    }

    const insert = database.prepare(`
      INSERT INTO embeddings (collectionId, model, dimensions, inputHash, vector, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(collectionId) DO UPDATE SET
        model = excluded.model, dimensions = excluded.dimensions,
        inputHash = excluded.inputHash, vector = excluded.vector, createdAt = excluded.createdAt
    `);

    const usage: EmbeddingUsage = { promptTokens: 0, requests: 0, cacheHits: papers.length - pending.length };
    for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
      const slice = pending.slice(offset, offset + BATCH_SIZE);
      const { embeddings, promptTokens } = await embedBatch(slice.map((index) => texts[index]!), apiKey);
      const createdAt = new Date().toISOString();
      database.exec("BEGIN");
      try {
        for (let position = 0; position < slice.length; position += 1) {
          const index = slice[position]!;
          const vector = embeddings[position]!;
          insert.run(
            papers[index]!.collectionId, EMBEDDING_MODEL, vector.length,
            hashes[index]!, encodeVector(vector), createdAt,
          );
        }
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
      usage.requests += 1;
      usage.promptTokens += promptTokens;
      options.onProgress?.(Math.min(offset + BATCH_SIZE, pending.length), pending.length);
    }

    const select = database.prepare("SELECT vector FROM embeddings WHERE collectionId = ?");
    const vectors = papers.map((paper) => {
      const row = select.get(paper.collectionId) as { vector: Uint8Array } | undefined;
      if (!row) throw new Error(`Missing embedding for ${paper.collectionId}`);
      return normalize(decodeVector(row.vector));
    });
    return { vectors, usage };
  } finally {
    database.close();
  }
}
