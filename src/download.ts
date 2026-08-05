import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { prepareDocument } from "./pdf.js";
import type { DocumentInfo, Source } from "./types.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value = "true"] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const sourceFile = path.resolve(args["source-file"] ?? "sources.json");
const sources = JSON.parse(await readFile(sourceFile, "utf8")) as Source[];
const profilePath = args.profile ? path.resolve(args.profile) : null;
const checkpointPath = profilePath
  ? profilePath.replace(/\.json$/, ".checkpoint.json")
  : null;
const prior = checkpointPath ? await readCheckpoint(checkpointPath) : null;
if (prior && prior.sourceFile !== sourceFile) {
  throw new Error(`Checkpoint ${checkpointPath} belongs to a different source file`);
}
const profiles: Profile[] = prior?.profiles ?? [];
const failures: Failure[] = prior?.failures ?? [];
const completed = new Set(profiles.map((profile) => profile.id));

for (const source of sources) {
  if (completed.has(source.id)) {
    console.log(`Resuming: ${source.id}`);
    continue;
  }
  const previousFailure = failures.findIndex((failure) => failure.id === source.id);
  if (previousFailure >= 0) failures.splice(previousFailure, 1);
  try {
    const document = await prepareDocument(source);
    const { chunks: _chunks, path: _path, ...profile } = document;
    profiles.push(profile);
    completed.add(source.id);
    console.log(
      `${source.id}: ${document.pages} pages, ${document.characters} chars, ${document.chunks.length} chunks, sha256=${document.sha256}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push({ id: source.id, url: source.pdfUrl, error: message });
    console.error(`${source.id}: FAILED: ${message}`);
  }
  if (checkpointPath) await writeCheckpoint(checkpointPath, true);
}

profiles.sort(
  (a, b) =>
    sources.findIndex((source) => source.id === a.id) -
    sources.findIndex((source) => source.id === b.id),
);
if (checkpointPath) await writeCheckpoint(checkpointPath, failures.length > 0);
if (failures.length) {
  throw new Error(
    `${failures.length}/${sources.length} PDFs failed; rerun to retry only failures`,
  );
}
if (profilePath) {
  await writeFile(profilePath, `${JSON.stringify(profiles, null, 2)}\n`);
  console.log(`Wrote ${profiles.length} document profiles to ${profilePath}`);
}

async function writeCheckpoint(file: string, incomplete: boolean) {
  await writeFile(
    file,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceFile,
        incomplete,
        profiles,
        failures,
      },
      null,
      2,
    ),
  );
}

async function readCheckpoint(file: string) {
  try {
    return JSON.parse(await readFile(file, "utf8")) as {
      sourceFile: string;
      profiles: Profile[];
      failures: Failure[];
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

type Profile = Omit<DocumentInfo, "chunks" | "path">;
type Failure = { id: string; url: string; error: string };
