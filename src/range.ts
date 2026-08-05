import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Source } from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const start = positiveInteger(args.start, "start");
const end = positiveInteger(args.end, "end");
if (end < start) throw new Error("end must be greater than or equal to start");

const sourceFile = path.resolve(args["source-file"] ?? "corpus/sources-1000.json");
const outputFile = path.resolve(
  args.output ?? `corpus/shards/${start}-${end}.json`,
);
const sources = JSON.parse(await readFile(sourceFile, "utf8")) as Source[];
const selected = sources
  .filter(
    (source) =>
      source.rank !== undefined && source.rank >= start && source.rank <= end,
  )
  .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
const expected = end - start + 1;
if (selected.length !== expected) {
  throw new Error(
    `Expected ${expected} sources for ranks ${start}-${end}, found ${selected.length}`,
  );
}

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(selected, null, 2)}\n`);
console.log(`Wrote ${selected.length} sources to ${outputFile}`);

function positiveInteger(value: string | undefined, name: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}
