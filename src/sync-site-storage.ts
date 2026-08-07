import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildSiteData, type SitePaper, type SitePaperListing } from "./site-data.js";
import {
  createTigrisClient,
  ensurePublicReadCors,
  gzipJson,
  imageContentType,
  imageObjectKey,
  paperSummaryObjectKey,
  publicObjectUrl,
  uploadObject,
  type ImageKind,
} from "./tigris-storage.js";

const projectRoot = process.cwd();
const args = parseArgs(process.argv.slice(2));
const client = createTigrisClient();
await ensurePublicReadCors(client);

if (args.kind || args.id || args.file) {
  if (!args.kind || !args.id || !args.file) {
    throw new Error("Targeted image uploads require --kind, --id, and --file together.");
  }
  await uploadImage(args.kind, args.id, path.resolve(projectRoot, args.file));
} else {
  const { paperData, catalogData, homepageData, mostCitedData, mostStarredData, searchData, relatedPapersById } = await buildSiteData(projectRoot);
  const selectedPaper = args.paperId
    ? paperData.papers.find((paper) => paper.id === args.paperId)
    : undefined;
  if (args.paperId && !selectedPaper) throw new Error(`Unknown paper ID: ${args.paperId}`);

  const uploads: Array<() => Promise<unknown>> = [];

  const globalJson = gzipJson(paperData);
  const catalogJson = gzipJson(catalogData);
  const homepageJson = gzipJson(homepageData);
  const mostCitedJson = gzipJson(mostCitedData);
  const mostStarredJson = gzipJson(mostStarredData);
  const searchJson = gzipJson(searchData);
  uploads.push(
    () => uploadObject(client, {
      key: "summaries.json",
      body: globalJson.body,
      contentType: "application/json",
      contentEncoding: "gzip",
      cacheControl: "public, max-age=300, stale-while-revalidate=3600",
    }),
    () => uploadObject(client, {
      key: "catalog.json",
      body: catalogJson.body,
      contentType: "application/json",
      contentEncoding: "gzip",
      cacheControl: "public, max-age=300, stale-while-revalidate=3600",
    }),
    () => uploadObject(client, {
      key: "homepage.json",
      body: homepageJson.body,
      contentType: "application/json",
      contentEncoding: "gzip",
      cacheControl: "public, max-age=300, stale-while-revalidate=3600",
    }),
    () => uploadObject(client, {
      key: "most-cited.json",
      body: mostCitedJson.body,
      contentType: "application/json",
      contentEncoding: "gzip",
      cacheControl: "public, max-age=300, stale-while-revalidate=3600",
    }),
    () => uploadObject(client, {
      key: "most-starred.json",
      body: mostStarredJson.body,
      contentType: "application/json",
      contentEncoding: "gzip",
      cacheControl: "public, max-age=300, stale-while-revalidate=3600",
    }),
    () => uploadObject(client, {
      key: "search-index.json",
      body: searchJson.body,
      contentType: "application/json",
      contentEncoding: "gzip",
      cacheControl: "public, max-age=300, stale-while-revalidate=3600",
    }),
  );

  const papers = selectedPaper ? [selectedPaper] : paperData.papers;
  uploads.push(...papers.map((paper) => () => uploadPaperSummary(
    paper,
    relatedPapersById.get(paper.id) ?? [],
    paperData.generatedAt,
  )));
  await runWithConcurrency(uploads, 12);

  await verifyPublicJson("summaries.json", paperData.papers.length);
  await verifyPublicJson("catalog.json", catalogData.papers.length);
  await verifyPublicJson("homepage.json", homepageData.mostCited.length, "mostCited");
  await verifyPublicJson("most-cited.json", mostCitedData.papers.length);
  await verifyPublicJson("most-starred.json", mostStarredData.papers.length);
  await verifyPublicJson(paperSummaryObjectKey(papers[0]!.id), 1);
  console.log(`Synced ${papers.length} paper summaries plus compact catalog, homepage, rankings, and search indexes.`);
}

async function uploadImage(kind: ImageKind, id: string, file: string) {
  const extension = path.extname(file);
  const key = imageObjectKey(kind, id, extension);
  const result = await uploadObject(client, {
    key,
    body: await readFile(file),
    contentType: imageContentType(extension),
    cacheControl: "public, max-age=3600, stale-while-revalidate=86400",
  });
  console.log(`Uploaded ${result.key} (${result.bytes} bytes)`);
  return result;
}

async function uploadPaperSummary(paper: SitePaper, relatedPapers: SitePaperListing[], generatedAt: string) {
  const json = gzipJson({ schemaVersion: 1, generatedAt, paper, relatedPapers });
  return uploadObject(client, {
    key: paperSummaryObjectKey(paper.id),
    body: json.body,
    contentType: "application/json",
    contentEncoding: "gzip",
    cacheControl: "public, max-age=300, stale-while-revalidate=3600",
  });
}

async function verifyPublicJson(key: string, expectedPapers: number, arrayField = "papers") {
  const response = await fetch(publicObjectUrl(key), { cache: "no-store" });
  if (!response.ok) throw new Error(`Public verification failed for ${key}: ${response.status}`);
  const data = await response.json() as Record<string, unknown> & { paper?: unknown };
  const collection = data[arrayField];
  const count = Array.isArray(collection) ? collection.length : (data.paper ? 1 : 0);
  if (count !== expectedPapers) {
    throw new Error(`Public verification returned ${count} papers for ${key}; expected ${expectedPapers}`);
  }
}

async function runWithConcurrency(tasks: Array<() => Promise<unknown>>, concurrency: number) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (nextIndex < tasks.length) {
      const task = tasks[nextIndex++];
      await task!();
    }
  });
  await Promise.all(workers);
}

function parseArgs(argv: string[]) {
  const values: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith("--") || !value) throw new Error(`Invalid argument near ${flag ?? "end"}`);
    values[flag.slice(2)] = value;
  }
  const kind = values.kind;
  if (kind && kind !== "cover" && kind !== "social" && kind !== "topic") {
    throw new Error(`Invalid image kind: ${kind}`);
  }
  return {
    kind: kind as ImageKind | undefined,
    id: values.id,
    file: values.file,
    paperId: values["paper-id"],
  };
}
