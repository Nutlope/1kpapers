import type { MetadataRoute } from "next";
import { labs } from "../lib/labs";
import { monthDefinitions } from "../lib/months";
import { getPaperCatalog } from "../lib/papers";
import { absoluteSiteUrl } from "../lib/site-url";
import { topics } from "../lib/topics";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { papers, generatedAt } = await getPaperCatalog();
  const lastModified = new Date(generatedAt);
  const collections = [
    "/",
    "/topics",
    "/labs",
    "/most-trending-papers",
    "/most-cited-papers",
    "/most-starred-papers",
    ...topics.map((topic) => `/topics/${topic.slug}`),
    ...labs.map((lab) => `/labs/${lab.slug}`),
    ...monthDefinitions.map((month) => `/months/${month.key}`),
  ];

  return [
    ...collections.map((path) => ({
      url: absoluteSiteUrl(path),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...papers.map((paper) => ({
      url: absoluteSiteUrl(`/papers/${paper.id}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
