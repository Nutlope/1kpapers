import assert from "node:assert/strict";
import test from "node:test";
import {
  chunkText,
  mainBodyBeforeReferences,
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

test("never splits a valid Unicode pair across chunk boundaries", () => {
  const text = `${"a".repeat(MAX_CHUNK_CHARACTERS - 1)}😀tail`;
  const chunks = chunkText(text);
  assert.equal(chunks.join(""), text);
  assert.equal(chunks.length, 2);
  assert.equal(sanitizeExtractedText(chunks[0]!), chunks[0]);
  assert.equal(sanitizeExtractedText(chunks[1]!), chunks[1]);
});

test("supports smaller reproducible chunk boundaries", () => {
  assert.deepEqual(chunkText("a".repeat(25), 10).map((chunk) => chunk.length), [
    10,
    10,
    5,
  ]);
  assert.throws(() => chunkText("text", 0), /positive integer/);
});

test("can reproducibly limit a paper to its main body", () => {
  const document = {
    id: "paper",
    title: "Paper",
    kind: "research-paper",
    landingPage: "https://example.com",
    pdfUrl: "https://example.com/paper.pdf",
    publisher: "Example",
    availability: "Public",
    path: "/tmp/paper.pdf",
    sha256: "abc",
    bytes: 1,
    pages: 2,
    characters: 35,
    chunks: ["Main result.\n\nReferences\nCitation."],
  };
  const mainBody = mainBodyBeforeReferences(document, 10);
  assert.equal(mainBody.characters, 12);
  assert.equal(mainBody.chunks.join(""), "Main result.");
  assert.equal(mainBody.pages, 2);
});
