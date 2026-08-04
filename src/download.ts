import { readFile } from "node:fs/promises";
import { prepareDocument } from "./pdf.js";
import type { Source } from "./types.js";

const sources = JSON.parse(
  await readFile(new URL("../sources.json", import.meta.url), "utf8"),
) as Source[];

for (const source of sources) {
  const document = await prepareDocument(source);
  console.log(
    `${source.id}: ${document.pages} pages, ${document.characters} chars, ${document.chunks.length} chunks, sha256=${document.sha256}`,
  );
}
