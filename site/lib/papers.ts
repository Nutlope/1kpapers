import { cache } from "react";
import type { Paper, PaperListing } from "./paper-shared";
import { HOMEPAGE_DATA_URL, MOST_CITED_DATA_URL, MOST_STARRED_DATA_URL, paperSummaryUrl, PAPER_CATALOG_URL } from "./public-storage";

export type { Paper, PaperListing } from "./paper-shared";
export { formatCompactNumber, formatMonthYear, topicLabel } from "./paper-shared";

type PaperCatalogData = {
  schemaVersion: number;
  generatedAt: string;
  papers: PaperListing[];
};

export type HomepageData = {
  schemaVersion: number;
  generatedAt: string;
  featured: Paper;
  trending: PaperListing[];
  mostCited: PaperListing[];
  monthCounts: Record<string, number>;
  topicCounts: Record<string, number>;
  reasoningCount: number;
  agentCount: number;
};

export type MostCitedData = {
  schemaVersion: number;
  generatedAt: string;
  papers: PaperListing[];
  paperCount: number;
};

export type MostStarredData = MostCitedData;

export type PaperDetails = {
  paper: Paper;
  relatedPapers: PaperListing[];
};

export const getPaperCatalog = cache(async (): Promise<PaperCatalogData> => {
  const response = await fetch(PAPER_CATALOG_URL, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Could not load paper catalog from ${PAPER_CATALOG_URL}: ${response.status}`);
  }
  return (await response.json()) as PaperCatalogData;
});

export const getHomepageData = cache(async (): Promise<HomepageData> => {
  const response = await fetch(HOMEPAGE_DATA_URL, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Could not load homepage data from ${HOMEPAGE_DATA_URL}: ${response.status}`);
  }
  return (await response.json()) as HomepageData;
});

export const getMostCitedData = cache(async (): Promise<MostCitedData> => {
  const response = await fetch(MOST_CITED_DATA_URL, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Could not load most-cited data from ${MOST_CITED_DATA_URL}: ${response.status}`);
  }
  return (await response.json()) as MostCitedData;
});

export const getMostStarredData = cache(async (): Promise<MostStarredData> => {
  const response = await fetch(MOST_STARRED_DATA_URL, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Could not load most-starred data from ${MOST_STARRED_DATA_URL}: ${response.status}`);
  }
  return (await response.json()) as MostStarredData;
});

export const getPaperDetails = cache(async (id: string): Promise<PaperDetails | undefined> => {
  const response = await fetch(paperSummaryUrl(id), { next: { revalidate: 3600 } });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Could not load paper ${id}: ${response.status}`);
  const data = await response.json() as { paper: Paper; relatedPapers?: PaperListing[] };
  return { paper: data.paper, relatedPapers: data.relatedPapers ?? [] };
});
