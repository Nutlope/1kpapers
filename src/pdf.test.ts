import assert from "node:assert/strict";
import test from "node:test";
import {
  chunkText,
  MAX_CHUNK_CHARACTERS,
  sanitizeExtractedText,
} from "./pdf.js";

test("keeps a short standalone-benchmark document in one chunk", () => {
  assert.deepEqual(chunkText("a".repeat(100)).map((chunk) => chunk.length), [100]);
});

test("uses only as many 50,000-character chunks as needed", () => {
  const chunks = chunkText("a".repeat(100_001));
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0]!.length, MAX_CHUNK_CHARACTERS);
  assert.equal(chunks.at(-1)!.length, 1);
});

test("replaces unpaired surrogates without damaging valid Unicode pairs", () => {
  assert.equal(sanitizeExtractedText("before\ud800after"), "before�after");
  assert.equal(sanitizeExtractedText("before\udc00after"), "before�after");
  assert.equal(sanitizeExtractedText("emoji 😀 stays"), "emoji 😀 stays");
});
