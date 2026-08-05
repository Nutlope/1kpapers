import { readFile, writeFile } from "node:fs/promises";
import type { Source } from "./types.js";

type CorpusPaper = {
  rank: number;
  arxivId: string;
  title: string;
  officialLab: string | null;
  hfUpvotes: number;
  topicTags: string[];
  landingUrl: string;
  pdfUrl: string;
};
const manifest = JSON.parse(await readFile("corpus/papers.json", "utf8")) as {
  papers: CorpusPaper[];
};
const sources: Source[] = manifest.papers.map((paper) => ({
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
if (sources.length !== 1_000) throw new Error(`Expected 1,000 sources, found ${sources.length}`);
await writeFile("corpus/sources-1000.json", `${JSON.stringify(sources, null, 2)}\n`);
console.log("Wrote 1,000 benchmark sources to corpus/sources-1000.json");
