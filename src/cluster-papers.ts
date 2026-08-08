import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cosineSimilarity, embedPapers, EMBEDDING_MODEL } from "./embeddings.js";
import { readPaperDatabase } from "./paper-database.js";

type ClusterPaper = {
  collectionId: string;
  title: string;
  summary: string;
  arxivCategories: string[];
  topicTags: string[];
};

const projectRoot = process.cwd();
const databasePath = path.join(projectRoot, "data", "papers.sqlite");
const derivedDatabasePath = path.join(projectRoot, "data", "derived.sqlite");

const args = process.argv.slice(2);
const clusterCount = Number(readFlag(args, "k") ?? 24);
const seed = Number(readFlag(args, "seed") ?? 7);
const sampleSize = Number(readFlag(args, "samples") ?? 8);

function readFlag(argv: string[], name: string) {
  const match = argv.find((argument) => argument.startsWith(`--${name}=`));
  return match?.slice(name.length + 3);
}

/** Deterministic RNG so a given --seed always reproduces the same clustering. */
function createRandom(value: number) {
  let state = value >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let drawn = Math.imul(state ^ (state >>> 15), 1 | state);
    drawn = (drawn + Math.imul(drawn ^ (drawn >>> 7), 61 | drawn)) ^ drawn;
    return ((drawn ^ (drawn >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vectors are unit length, so cosine distance is a valid Lloyd's metric. */
function distance(left: Float64Array, right: Float64Array) {
  return 1 - cosineSimilarity(left, right);
}

function meanVector(members: Float64Array[], dimensions: number) {
  const centroid = new Float64Array(dimensions);
  for (const member of members) {
    for (let index = 0; index < dimensions; index += 1) centroid[index] = centroid[index]! + member[index]!;
  }
  let sum = 0;
  for (const value of centroid) sum += value * value;
  const magnitude = Math.sqrt(sum) || 1;
  for (let index = 0; index < dimensions; index += 1) centroid[index] = centroid[index]! / magnitude;
  return centroid;
}

function nearestCentroid(vector: Float64Array, centroids: Float64Array[]) {
  let best = 0;
  let bestDistance = Infinity;
  for (let index = 0; index < centroids.length; index += 1) {
    const candidate = distance(vector, centroids[index]!);
    if (candidate < bestDistance) {
      bestDistance = candidate;
      best = index;
    }
  }
  return { index: best, distance: bestDistance };
}

/** k-means++ seeding keeps initial centroids spread out instead of clumped. */
function initializeCentroids(vectors: Float64Array[], k: number, random: () => number) {
  const centroids: Float64Array[] = [vectors[Math.floor(random() * vectors.length)]!];
  while (centroids.length < k) {
    const weights = vectors.map((vector) => nearestCentroid(vector, centroids).distance ** 2);
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let target = random() * total;
    let chosen = vectors.length - 1;
    for (let index = 0; index < weights.length; index += 1) {
      target -= weights[index]!;
      if (target <= 0) {
        chosen = index;
        break;
      }
    }
    centroids.push(vectors[chosen]!);
  }
  return centroids;
}

function kMeans(vectors: Float64Array[], k: number, seed: number, maxIterations = 100) {
  const random = createRandom(seed);
  const dimensions = vectors[0]!.length;
  let centroids = initializeCentroids(vectors, k, random);
  let assignments = new Array<number>(vectors.length).fill(0);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next = vectors.map((vector) => nearestCentroid(vector, centroids).index);
    const changed = next.some((cluster, index) => cluster !== assignments[index]);
    assignments = next;

    const grouped: Float64Array[][] = Array.from({ length: k }, () => []);
    for (let index = 0; index < vectors.length; index += 1) grouped[assignments[index]!]!.push(vectors[index]!);

    centroids = grouped.map((members, index) => {
      if (members.length > 0) return meanVector(members, dimensions);
      // Re-seed an empty cluster with the point worst served by its current centroid.
      let worst = 0;
      let worstDistance = -Infinity;
      for (let position = 0; position < vectors.length; position += 1) {
        const candidate = distance(vectors[position]!, centroids[assignments[position]!]!);
        if (candidate > worstDistance) {
          worstDistance = candidate;
          worst = position;
        }
      }
      assignments[worst] = index;
      return vectors[worst]!;
    });

    if (!changed && iteration > 0) break;
  }
  return { assignments, centroids };
}

function topCounts(values: string[], limit: number) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, limit);
}

const dataset = readPaperDatabase(databasePath);
const papers = dataset.papers.map((paper) => ({
  collectionId: String(paper.collectionId),
  title: String(paper.title),
  summary: String(paper.summary ?? ""),
  arxivCategories: (paper.arxivCategories ?? []) as string[],
  topicTags: (paper.topicTags ?? []) as string[],
})) satisfies ClusterPaper[];

process.stdout.write(`Embedding ${papers.length} papers with ${EMBEDDING_MODEL}\n`);
const { vectors, usage } = await embedPapers(papers, {
  databasePath: derivedDatabasePath,
  onProgress: (done, total) => process.stdout.write(`  embedded ${done}/${total}\r`),
});
process.stdout.write(
  `\nReused ${usage.cacheHits}, requests ${usage.requests}, prompt tokens ${usage.promptTokens}\n`,
);

process.stdout.write(`Clustering into k=${clusterCount} (seed ${seed})\n`);
const { assignments, centroids } = kMeans(vectors, clusterCount, seed);

const clusters = centroids.map((centroid, index) => {
  const members = papers
    .map((paper, position) => ({ paper, position }))
    .filter(({ position }) => assignments[position] === index)
    .map(({ paper, position }) => ({ paper, similarity: cosineSimilarity(vectors[position]!, centroid) }))
    .sort((left, right) => right.similarity - left.similarity);
  return {
    index,
    size: members.length,
    members,
    categories: topCounts(members.flatMap(({ paper }) => paper.arxivCategories), 4),
    tags: topCounts(members.flatMap(({ paper }) => paper.topicTags), 3),
  };
}).sort((left, right) => right.size - left.size);

const sizes = clusters.map((cluster) => cluster.size);
const largestShare = ((sizes[0]! / papers.length) * 100).toFixed(1);

const lines: string[] = [
  `# Paper clusters (k=${clusterCount}, seed=${seed})`,
  "",
  `Generated from \`data/papers.sqlite\` (${papers.length} papers) using \`${EMBEDDING_MODEL}\`.`,
  "",
  `Largest cluster holds ${sizes[0]} papers (${largestShare}%); smallest holds ${sizes.at(-1)}.`,
  "",
  "| # | Papers | Top arXiv categories | Current topic tags |",
  "| ---: | ---: | --- | --- |",
  ...clusters.map((cluster, rank) =>
    `| ${rank + 1} | ${cluster.size} | ${cluster.categories.map(([name, count]) => `${name} ${count}`).join(", ") || "—"} | ${cluster.tags.map(([name, count]) => `${name} ${count}`).join(", ") || "—"} |`,
  ),
  "",
  "---",
  "",
];

for (const [rank, cluster] of clusters.entries()) {
  lines.push(
    `## Cluster ${rank + 1} — ${cluster.size} papers`,
    "",
    `Categories: ${cluster.categories.map(([name, count]) => `${name} (${count})`).join(", ") || "—"}`,
    "",
    ...cluster.members.slice(0, sampleSize).map(({ paper, similarity }) =>
      `- ${similarity.toFixed(3)} — ${paper.title}`,
    ),
    "",
  );
}

const reportPath = path.join(projectRoot, "research", `paper-clusters-k${clusterCount}.md`);
await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${lines.join("\n")}\n`);

process.stdout.write(`\nCluster sizes: ${sizes.join(", ")}\n`);
process.stdout.write(`Largest cluster ${largestShare}% of corpus\n`);
process.stdout.write(`Report written to ${path.relative(projectRoot, reportPath)}\n`);
