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

export type PaperListing = Pick<
  Paper,
  | "id"
  | "title"
  | "authors"
  | "publishedAt"
  | "landingUrl"
  | "topics"
  | "upvotes"
  | "summary"
  | "lab"
  | "citations"
  | "githubRepository"
  | "githubStars"
  | "venue"
>;

export type PaperCardData = Pick<Paper, "id" | "title" | "publishedAt" | "lab" | "venue">;

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
