import { cache } from "react";
import type { Paper, PaperListing } from "./paper-shared";
import { buildPaperSlugMap } from "./paper-url";
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
  trending: PaperListing[];
  mostCited: PaperListing[];
  monthCounts: Record<string, number>;
  topicCounts: Record<string, number>;
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

export type ResolvedPaperRoute = {
  sourceId: string;
  slug: string;
  listing: PaperListing;
};

export const getPaperCatalog = cache(async (): Promise<PaperCatalogData> => {
  const response = await fetch(PAPER_CATALOG_URL, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Could not load paper catalog from ${PAPER_CATALOG_URL}: ${response.status}`);
  }
  return (await response.json()) as PaperCatalogData;
});

const getPaperRoutes = cache(async (): Promise<ResolvedPaperRoute[]> => {
  const { papers } = await getPaperCatalog();
  const slugs = buildPaperSlugMap(papers);
  return papers.map((listing) => ({
    sourceId: listing.id,
    slug: slugs.get(listing.id)!,
    listing,
  }));
});

export const resolvePaperRoute = cache(async (identifier: string): Promise<ResolvedPaperRoute | undefined> => {
  const routes = await getPaperRoutes();
  return routes.find((route) => route.sourceId === identifier)
    ?? routes.find((route) => route.slug === identifier);
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
