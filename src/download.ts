import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prepareDocument } from "./pdf.js";
import type { Source } from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const sourceFile = path.resolve(args["source-file"] ?? "sources.json");
const sources = JSON.parse(await readFile(sourceFile, "utf8")) as Source[];
const profiles = [];

for (const source of sources) {
  const document = await prepareDocument(source);
  const { chunks: _chunks, path: _path, ...profile } = document;
  profiles.push(profile);
  console.log(
    `${source.id}: ${document.pages} pages, ${document.characters} chars, ${document.chunks.length} chunks, sha256=${document.sha256}`,
  );
}

if (args.profile) {
  const profilePath = path.resolve(args.profile);
  await writeFile(profilePath, `${JSON.stringify(profiles, null, 2)}\n`);
  console.log(`Wrote document profiles to ${profilePath}`);
}
