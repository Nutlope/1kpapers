import { readFile } from "node:fs/promises";
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

export type SitePaper = ReturnType<typeof toSitePaper>;

export type SitePaperData = {
  schemaVersion: 1;
  generatedAt: string;
  papers: SitePaper[];
};

export type SiteSearchData = {
  schemaVersion: 1;
  generatedAt: string;
  papers: Array<{
    id: string;
    title: string;
    authors: string[];
    lab: string | null;
    topics: string[];
    publishedAt: string;
  }>;
};

export async function buildSiteData(projectRoot = process.cwd()): Promise<{
  paperData: SitePaperData;
  searchData: SiteSearchData;
}> {
  const sourcePath = path.join(projectRoot, "metadata", "papers.json");
  const source = JSON.parse(await readFile(sourcePath, "utf8")) as MetadataFile;
  const papers = source.papers.map(toSitePaper);

  return {
    paperData: {
      schemaVersion: 1,
      generatedAt: source.generatedAt,
      papers,
    },
    searchData: {
      schemaVersion: 1,
      generatedAt: source.generatedAt,
      papers: papers.map((paper) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        lab: paper.lab,
        topics: paper.topics,
        publishedAt: paper.publishedAt,
      })),
    },
  };
}

function toSitePaper(paper: SourcePaper) {
  return {
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
  };
}
