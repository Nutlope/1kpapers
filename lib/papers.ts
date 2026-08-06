import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

export type Paper = {
  id: string;
  arxivId: string | null;
  title: string;
  authors: string[];
  abstract: string | null;
  publishedAt: string;
  landingUrl: string;
  pdfUrl: string | null;
  pageCount: number | null;
  topics: string[];
  categories: string[];
  upvotes: number | null;
  summary: string;
  lab: string | null;
  citations: number | null;
  githubRepository: string | null;
  githubStars: number | null;
  projectPage: string | null;
  doi: string | null;
  venue: string | null;
  license: string | null;
};

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

export function formatMonthYear(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function formatCompactNumber(value: number | null) {
  if (value === null) return "Not indexed";
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

export function topicLabel(topic: string) {
  const labels: Record<string, string> = {
    "llms-agents-reasoning": "Reasoning and agents",
    "vision-multimodal-generation": "Multimodal",
    "systems-efficiency": "Systems",
    "robotics-embodied-ai": "Robotics",
    "science-medicine": "Science",
  };
  return labels[topic] ?? topic.replaceAll("-", " ");
}
