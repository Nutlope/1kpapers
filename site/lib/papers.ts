import { cache } from "react";
import type { Paper } from "./paper-shared";
import { paperSummaryUrl, SUMMARIES_URL } from "./public-storage";

export type { Paper } from "./paper-shared";
export { formatCompactNumber, formatMonthYear, topicLabel } from "./paper-shared";

type PaperData = {
  schemaVersion: number;
  generatedAt: string;
  papers: Paper[];
};

export const getPaperData = cache(async (): Promise<PaperData> => {
  const response = await fetch(SUMMARIES_URL, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`Could not load paper data from ${SUMMARIES_URL}: ${response.status}`);
  }
  return (await response.json()) as PaperData;
});

export const getPaper = cache(async (id: string): Promise<Paper | undefined> => {
  const response = await fetch(paperSummaryUrl(id), { next: { revalidate: 3600 } });
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Could not load paper ${id}: ${response.status}`);
  const data = await response.json() as { paper: Paper };
  return data.paper;
});
