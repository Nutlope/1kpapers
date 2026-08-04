import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { BenchmarkRow } from "./types.js";

const files = process.argv.slice(2);
if (files.length < 2) {
  throw new Error("Usage: pnpm merge <result.json> <result.json> [...]");
}

const merged = new Map<string, BenchmarkRow>();
for (const file of files) {
  const result = JSON.parse(await readFile(file, "utf8")) as {
    rows: BenchmarkRow[];
  };
  for (const row of result.rows) {
    merged.set(`${row.model.id}\0${row.source.id}`, row);
  }
}

const generatedAt = new Date().toISOString();
const result = {
  generatedAt,
  methodologyVersion: 1,
  mergedFrom: files,
  rows: [...merged.values()],
};
await mkdir("results/raw", { recursive: true });
const stamp = generatedAt.replaceAll(":", "-");
await writeFile("results/latest.json", JSON.stringify(result, null, 2));
await writeFile(
  `results/raw/${stamp}-merged.json`,
  JSON.stringify(result, null, 2),
);
console.log(`Merged ${result.rows.length} model/PDF rows from ${files.length} files`);
