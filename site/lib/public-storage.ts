export const PUBLIC_STORAGE_BASE_URL = (
  process.env.NEXT_PUBLIC_STORAGE_BASE_URL ?? "https://year-in-ai-papers.t3.tigrisfiles.io"
).replace(/\/$/, "");

export const PAPER_CATALOG_URL = process.env.PAPER_CATALOG_URL ?? `${PUBLIC_STORAGE_BASE_URL}/catalog.json`;
export const HOMEPAGE_DATA_URL = process.env.HOMEPAGE_DATA_URL ?? `${PUBLIC_STORAGE_BASE_URL}/homepage.json`;
export const MOST_CITED_DATA_URL = process.env.MOST_CITED_DATA_URL ?? `${PUBLIC_STORAGE_BASE_URL}/most-cited.json`;
export const MOST_STARRED_DATA_URL = process.env.MOST_STARRED_DATA_URL ?? `${PUBLIC_STORAGE_BASE_URL}/most-starred.json`;
export const SEARCH_INDEX_URL = `${PUBLIC_STORAGE_BASE_URL}/search-index.json`;

export function paperAssetUrl(paperId: string, asset: "cover" | "social") {
  return `${PUBLIC_STORAGE_BASE_URL}/papers/${encodeURIComponent(paperId)}/${asset}.png`;
}

export function paperSummaryUrl(paperId: string) {
  return `${PUBLIC_STORAGE_BASE_URL}/papers/${encodeURIComponent(paperId)}/summary.json?v=2`;
}

export function topicArtUrl(topicId: string) {
  return `${PUBLIC_STORAGE_BASE_URL}/topics/${encodeURIComponent(topicId)}/art.png`;
}
