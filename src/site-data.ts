import path from "node:path";
import { buildPaperSlugMap } from "../shared/paper-slug.js";
import { assignmentToList, readEditorialTopics } from "./editorial-topics.js";
import { readPaperDatabase } from "./paper-database.js";

type SourcePaper = {
  collectionId: string;
  slug?: string;
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
export type SitePaperListing = ReturnType<typeof toListingPaper>;

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
    slug: string;
    title: string;
    authors: string[];
    lab: string | null;
    topics: string[];
    publishedAt: string;
  }>;
};

export type SiteCatalogData = {
  schemaVersion: 1;
  generatedAt: string;
  papers: SitePaperListing[];
};

export type SiteHomepageData = {
  schemaVersion: 1;
  generatedAt: string;
  trending: SitePaperListing[];
  mostCited: SitePaperListing[];
  monthCounts: Record<string, number>;
  topicCounts: Record<string, number>;
};

export type SiteMostCitedData = {
  schemaVersion: 1;
  generatedAt: string;
  papers: SitePaperListing[];
  paperCount: number;
};

export type SiteMostStarredData = {
  schemaVersion: 1;
  generatedAt: string;
  papers: SitePaperListing[];
  paperCount: number;
};

const editorialTrendingIds = [
  "arxiv-2512.02556",
  "arxiv-2602.02276",
  "arxiv-2511.21631",
  "arxiv-2508.10104",
  "arxiv-2511.16719",
  "arxiv-2602.15763",
  "arxiv-2510.18234",
  "arxiv-2607.24653",
  "arxiv-2509.04664",
] as const;

export async function buildSiteData(
  projectRoot = process.cwd(),
  databasePath = path.join(projectRoot, "data", "papers.sqlite"),
): Promise<{
  paperData: SitePaperData;
  catalogData: SiteCatalogData;
  homepageData: SiteHomepageData;
  mostCitedData: SiteMostCitedData;
  mostStarredData: SiteMostStarredData;
  searchData: SiteSearchData;
  relatedPapersById: Map<string, SitePaperListing[]>;
}> {
  const source = readPaperDatabase(databasePath) as unknown as MetadataFile;
  const editorialTopics = readEditorialTopics(path.join(projectRoot, "data", "derived.sqlite"));
  const slugs = buildPaperSlugMap(source.papers.map((paper) => ({
    id: paper.collectionId,
    title: paper.title,
    ...(paper.slug ? { slug: paper.slug } : {}),
  })));
  const papers = source.papers.map((paper) => toSitePaper(paper, editorialTopics, slugs.get(paper.collectionId)!));

  const indexes = buildSiteIndexes(papers, source.generatedAt);

  return {
    paperData: {
      schemaVersion: 1,
      generatedAt: source.generatedAt,
      papers,
    },
    ...indexes,
    searchData: {
      schemaVersion: 1,
      generatedAt: source.generatedAt,
      papers: papers.map((paper) => ({
        id: paper.id,
        slug: paper.slug,
        title: paper.title,
        authors: paper.authors,
        lab: paper.lab,
        topics: [...new Set([...paper.topics, ...paper.editorialTopics])],
        publishedAt: paper.publishedAt,
      })),
    },
  };
}

export function buildSiteIndexes(papers: SitePaper[], generatedAt: string): {
  catalogData: SiteCatalogData;
  homepageData: SiteHomepageData;
  mostCitedData: SiteMostCitedData;
  mostStarredData: SiteMostStarredData;
  relatedPapersById: Map<string, SitePaperListing[]>;
} {
  if (papers.length === 0) throw new Error("Cannot build site indexes without papers");

  const listings = papers.map(toListingPaper);
  const trendingPapers = selectTrendingPapers(papers);
  const mostCitedPapers = papers
    .filter((paper) => paper.citations !== null)
    .sort((a, b) => (b.citations ?? 0) - (a.citations ?? 0));
  const mostCitedListings = mostCitedPapers.slice(0, 100).map(toListingPaper);
  const mostStarredPapers = papers
    .filter((paper) => paper.githubRepository && paper.githubStars !== null)
    .sort((left, right) =>
      (right.githubStars ?? 0) - (left.githubStars ?? 0) ||
      (right.citations ?? 0) - (left.citations ?? 0) ||
      right.publishedAt.localeCompare(left.publishedAt) ||
      left.id.localeCompare(right.id),
    );
  const monthCounts: Record<string, number> = {};
  const topicCounts: Record<string, number> = {};

  for (const paper of papers) {
    const month = paper.publishedAt.slice(0, 7);
    monthCounts[month] = (monthCounts[month] ?? 0) + 1;
    for (const topic of paper.topics) topicCounts[topic] = (topicCounts[topic] ?? 0) + 1;
  }

  return {
    catalogData: { schemaVersion: 1, generatedAt, papers: listings },
    homepageData: {
      schemaVersion: 1,
      generatedAt,
      trending: trendingPapers.map(toListingPaper),
      mostCited: mostCitedListings.slice(0, 3),
      monthCounts,
      topicCounts,
    },
    mostCitedData: {
      schemaVersion: 1,
      generatedAt,
      papers: mostCitedListings,
      paperCount: mostCitedPapers.length,
    },
    mostStarredData: {
      schemaVersion: 1,
      generatedAt,
      papers: mostStarredPapers.slice(0, 100).map(toListingPaper),
      paperCount: mostStarredPapers.length,
    },
    relatedPapersById: new Map(
      papers.map((paper) => [paper.id, selectRelatedPapers(paper, papers).map(toListingPaper)]),
    ),
  };
}

export function toListingPaper(paper: SitePaper) {
  return {
    id: paper.id,
    slug: paper.slug,
    title: paper.title,
    authors: paper.authors,
    publishedAt: paper.publishedAt,
    landingUrl: paper.landingUrl,
    topics: paper.topics,
    editorialTopics: paper.editorialTopics,
    primaryTopic: paper.primaryTopic,
    upvotes: paper.upvotes,
    summary: summaryExcerpt(paper.summary),
    lab: paper.lab,
    citations: paper.citations,
    githubRepository: paper.githubRepository,
    githubStars: paper.githubStars,
    venue: paper.venue,
  };
}

export function selectRelatedPapers(source: SitePaper, papers: SitePaper[], limit = 3) {
  return papers
    .filter((paper) => paper.id !== source.id)
    .map((paper) => ({ paper, score: relatedPaperScore(source, paper) }))
    .sort((a, b) =>
      b.score - a.score ||
      (b.paper.citations ?? 0) - (a.paper.citations ?? 0) ||
      b.paper.publishedAt.localeCompare(a.paper.publishedAt) ||
      a.paper.id.localeCompare(b.paper.id),
    )
    .slice(0, limit)
    .map(({ paper }) => paper);
}

function selectTrendingPapers(papers: SitePaper[], limit = editorialTrendingIds.length) {
  const byId = new Map(papers.map((paper) => [paper.id, paper]));
  const selected = editorialTrendingIds
    .map((id) => byId.get(id))
    .filter((paper): paper is SitePaper => Boolean(paper));
  const selectedIds = new Set(selected.map((paper) => paper.id));

  if (selected.length < limit) {
    const fallback = papers
      .filter((paper) => !selectedIds.has(paper.id))
      .sort((a, b) => breakthroughScore(b) - breakthroughScore(a));
    selected.push(...fallback.slice(0, limit - selected.length));
  }

  return selected.slice(0, limit);
}

function breakthroughScore(paper: SitePaper) {
  return Math.log1p(paper.citations ?? 0) * 5 +
    Math.log1p(paper.githubStars ?? 0) * 2 +
    Math.log1p(paper.upvotes ?? 0);
}

function relatedPaperScore(source: SitePaper, candidate: SitePaper) {
  const sharedTopics = source.topics.filter((topic) => candidate.topics.includes(topic)).length;
  const sharedCategories = source.categories.filter((category) => candidate.categories.includes(category)).length;
  const sameLab = source.lab !== null && source.lab === candidate.lab ? 1 : 0;
  return sharedTopics * 12 + sharedCategories * 3 + sameLab * 8;
}

function summaryExcerpt(summary: string, maxLength = 360) {
  const overview = (summary.split(/\n\s*\n/)[0] ?? summary).replace(/\s+/g, " ").trim();
  if (overview.length <= maxLength) return overview;
  const candidate = overview.slice(0, maxLength - 1).replace(/\s+\S*$/, "").trimEnd();
  return `${candidate || overview.slice(0, maxLength - 1)}…`;
}

function toSitePaper(
  paper: SourcePaper,
  editorialTopics: Map<string, { primary: string; secondary: string[] }>,
  slug: string,
) {
  const sitePaper = {
    id: paper.collectionId,
    slug,
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
  return {
    ...sitePaper,
    editorialTopics: assignmentToList(editorialTopics.get(paper.collectionId)),
    primaryTopic: editorialTopics.get(paper.collectionId)?.primary ?? null,
  };
}
