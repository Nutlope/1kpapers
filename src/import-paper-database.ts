import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPaperDatabase, type PaperDataset } from "./paper-database.js";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "metadata", "papers.json");
const databasePath = path.join(projectRoot, "data", "papers.sqlite");
const force = process.argv.slice(2).includes("--force");
const dataset = JSON.parse(await readFile(sourcePath, "utf8")) as PaperDataset;

createPaperDatabase(dataset, databasePath, { overwrite: force });
process.stdout.write(`Imported ${dataset.papers.length} papers into ${databasePath}\n`);
