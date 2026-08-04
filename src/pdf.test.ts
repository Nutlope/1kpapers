import assert from "node:assert/strict";
import test from "node:test";
import { chunkText, MAX_CHUNK_CHARACTERS } from "./pdf.js";

test("mirrors SmartPDFs' four-chunk policy", () => {
  assert.deepEqual(chunkText("a".repeat(100)).map((chunk) => chunk.length), [25, 25, 25, 25]);
});

test("caps chunks at 50,000 characters", () => {
  const chunks = chunkText("a".repeat(200_001));
  assert.equal(chunks.length, 5);
  assert.equal(chunks[0]!.length, MAX_CHUNK_CHARACTERS);
  assert.equal(chunks.at(-1)!.length, 1);
});
