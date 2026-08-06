import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Paper } from "./paper-shared";

export type { Paper } from "./paper-shared";
export { formatCompactNumber, formatMonthYear, topicLabel } from "./paper-shared";

type PaperData = {
  schemaVersion: number;
  generatedAt: string;
  papers: Paper[];
};

export const getPaperData = cache(async (): Promise<PaperData> => {
  const remoteUrl = process.env.PAPERS_DATA_URL;

  if (remoteUrl) {
    const response = await fetch(remoteUrl, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`Could not load paper data: ${response.status}`);
    }
    return (await response.json()) as PaperData;
  }

  const localPath = path.join(process.cwd(), "public", "data", "papers.json");
  return JSON.parse(await readFile(localPath, "utf8")) as PaperData;
});

export const getPaper = cache(async (id: string): Promise<Paper | undefined> => {
  const data = await getPaperData();
  return data.papers.find((paper) => paper.id === id);
});
