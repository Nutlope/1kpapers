import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SourcePaper = {
  collectionId: string;
  arxivId: string | null;
  title: string;
  authors: string[];
  abstract: string | null;
  publishedAt: string;
  landingUrl: string;
  pdfUrl: string | null;
  pageCount: number | null;
  topicTags: string[];
  arxivCategories: string[];
  hfUpvotes: number | null;
  summary: string;
  officialLab: string | null;
  citationCount: number | null;
  githubRepository: string | null;
  githubStars: number | null;
  projectPage: string | null;
  doi: string | null;
  venue: string | null;
  licenseName: string | null;
};

type MetadataFile = {
  schemaVersion: number;
  generatedAt: string;
  papers: SourcePaper[];
};

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "metadata", "papers.json");
const outputDirectory = path.join(projectRoot, "site", "public", "data");

const source = JSON.parse(await readFile(sourcePath, "utf8")) as MetadataFile;
const papers = source.papers.map((paper) => ({
  id: paper.collectionId,
  arxivId: paper.arxivId,
  title: paper.title,
  authors: paper.authors,
  abstract: paper.abstract,
  publishedAt: paper.publishedAt,
  landingUrl: paper.landingUrl,
  pdfUrl: paper.pdfUrl,
  pageCount: paper.pageCount,
  topics: paper.topicTags,
  categories: paper.arxivCategories,
  upvotes: paper.hfUpvotes,
  summary: paper.summary,
  lab: paper.officialLab,
  citations: paper.citationCount,
  githubRepository: paper.githubRepository,
  githubStars: paper.githubStars,
  projectPage: paper.projectPage,
  doi: paper.doi,
  venue: paper.venue,
  license: paper.licenseName,
}));

const searchIndex = papers.map((paper) => ({
  id: paper.id,
  title: paper.title,
  authors: paper.authors,
  lab: paper.lab,
  topics: paper.topics,
  publishedAt: paper.publishedAt,
}));

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(
    path.join(outputDirectory, "papers.json"),
    `${JSON.stringify({ schemaVersion: 1, generatedAt: source.generatedAt, papers }, null, 2)}\n`,
  ),
  writeFile(
    path.join(outputDirectory, "search-index.json"),
    `${JSON.stringify({ schemaVersion: 1, generatedAt: source.generatedAt, papers: searchIndex })}\n`,
  ),
]);

console.log(`Exported ${papers.length} papers to site/public/data.`);
