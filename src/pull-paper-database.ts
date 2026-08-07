import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { validatePaperDatabase } from "./paper-database.js";
import { paperDatabaseUrl } from "./tigris-storage.js";

const databasePath = path.join(process.cwd(), "data", "papers.sqlite");
const temporaryPath = `${databasePath}.download-${process.pid}`;
const response = await fetch(paperDatabaseUrl(), { cache: "no-store" });
if (!response.ok) throw new Error(`Could not download the canonical paper database: ${response.status}`);

await mkdir(path.dirname(databasePath), { recursive: true });
await writeFile(temporaryPath, new Uint8Array(await response.arrayBuffer()));
try {
  const { count } = validatePaperDatabase(temporaryPath, 1_018);
  await rename(temporaryPath, databasePath);
  process.stdout.write(`Downloaded and verified ${count} papers at ${databasePath}\n`);
} finally {
  await rm(temporaryPath, { force: true });
}
