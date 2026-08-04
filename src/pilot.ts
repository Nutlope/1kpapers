import { readFile, writeFile } from "node:fs/promises";
import type { Source } from "./types.js";

type CorpusPaper = {
  rank: number;
  arxivId: string;
  arxivVersion: string;
  title: string;
  hfUpvotes: number;
  officialLab: string | null;
  topicTags: string[];
  landingUrl: string;
  pdfUrl: string;
};

type CorpusManifest = { papers: CorpusPaper[] };

const inputPath = process.argv.find((arg) => arg.startsWith("--input="))?.slice("--input=".length) ?? "corpus/papers.json";
const outputPath = process.argv.find((arg) => arg.startsWith("--output="))?.slice("--output=".length) ?? "corpus/pilot-50.json";
const manifest = JSON.parse(await readFile(inputPath, "utf8")) as CorpusManifest;
const targetSize = 50;
const selected = new Map<string, CorpusPaper>();

for (const paper of manifest.papers.filter((paper) => paper.officialLab)) {
  selected.set(paper.arxivId, paper);
}

const topics = [
  "llms-agents-reasoning",
  "vision-multimodal-generation",
  "systems-efficiency",
  "robotics-embodied-ai",
  "science-medicine",
];
for (const topic of topics) {
  while ([...selected.values()].filter((paper) => paper.topicTags.includes(topic)).length < 8) {
    const next = manifest.papers.find((paper) => paper.topicTags.includes(topic) && !selected.has(paper.arxivId));
    if (!next) break;
    selected.set(next.arxivId, next);
  }
}

const months = [...new Set(manifest.papers.map((paper) => paper.arxivId.slice(0, 4)))];
for (const month of months) {
  while ([...selected.values()].filter((paper) => paper.arxivId.startsWith(month)).length < 2) {
    const next = manifest.papers.find((paper) => paper.arxivId.startsWith(month) && !selected.has(paper.arxivId));
    if (!next || selected.size >= targetSize) break;
    selected.set(next.arxivId, next);
  }
}

for (const paper of manifest.papers) {
  if (selected.size >= targetSize) break;
  selected.set(paper.arxivId, paper);
}

if (selected.size !== targetSize) throw new Error(`Expected ${targetSize} pilot papers, selected ${selected.size}`);

const sources: Source[] = [...selected.values()]
  .sort((a, b) => a.rank - b.rank)
  .map((paper) => ({
    id: `arxiv-${paper.arxivId}`,
    title: paper.title,
    kind: "research-paper",
    landingPage: paper.landingUrl,
    pdfUrl: paper.pdfUrl,
    publisher: paper.officialLab ? `${paper.officialLab} / arXiv` : "arXiv",
    availability: "Publicly downloadable from arXiv; version pinned in the frozen corpus",
    rank: paper.rank,
    arxivId: paper.arxivId,
    officialLab: paper.officialLab,
    hfUpvotes: paper.hfUpvotes,
    topicTags: paper.topicTags,
  }));

await writeFile(outputPath, `${JSON.stringify(sources, null, 2)}\n`);
console.log(`Wrote ${sources.length} pilot papers to ${outputPath}`);
console.log(`Official labs: ${Object.entries(Object.groupBy(sources.filter((source) => source.officialLab), (source) => source.officialLab!)).map(([lab, papers]) => `${lab}=${papers?.length ?? 0}`).join(", ")}`);
console.log(`Topics: ${topics.map((topic) => `${topic}=${sources.filter((source) => source.topicTags?.includes(topic)).length}`).join(", ")}`);

