import type { Paper } from "./paper-shared";
import { topicArtUrl } from "./public-storage";

type TopicPaper = Pick<Paper, "title" | "summary" | "topics"> &
  Partial<Pick<Paper, "abstract" | "editorialTopics">>;

export type TopicDefinition = {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  artwork: string;
  accent: "blue" | "orange" | "pink" | "cyan" | "yellow" | "violet";
  matches: (paper: TopicPaper) => boolean;
};

function matchesEditorialTopic(paper: TopicPaper, slug: string, fallback: () => boolean) {
  return paper.editorialTopics?.length ? paper.editorialTopics.includes(slug) : fallback();
}

function paperText(paper: TopicPaper) {
  return `${paper.title} ${paper.abstract ?? ""} ${paper.summary}`;
}

export const topics: TopicDefinition[] = [
  {
    slug: "reasoning",
    label: "Reasoning",
    shortLabel: "Reasoning",
    description: "Models that plan, verify, deliberate, and improve through inference-time or reinforcement-learning techniques.",
    artwork: topicArtUrl("reasoning"),
    accent: "blue",
    matches: (paper) => matchesEditorialTopic(paper, "reasoning", () =>
      /\breasoning\b|chain[- ]of[- ]thought|test[- ]time (?:compute|scaling|reasoning)|inference[- ]time (?:compute|scaling)|reinforcement learning with verifiable rewards|\brlvr\b|theorem proving|mathematical reasoning/i.test(paperText(paper)),
    ),
  },
  {
    slug: "agents",
    label: "Agents",
    shortLabel: "Agents",
    description: "Research on tool use, autonomous workflows, computer use, multi-agent coordination, and long-horizon action.",
    artwork: topicArtUrl("agents"),
    accent: "orange",
    matches: (paper) => matchesEditorialTopic(paper, "agents", () =>
      /\bagents?\b|\bagentic\b|tool[- ](?:use|using|integrated)|computer use|multi[- ]agent|autonomous (?:workflow|system)|long[- ]horizon (?:action|task|planning)/i.test(paperText(paper)),
    ),
  },
  {
    slug: "multimodal",
    label: "Multimodal",
    shortLabel: "Multimodal",
    description: "Vision, audio, video, image generation, and models that reason across several kinds of media.",
    artwork: topicArtUrl("multimodal"),
    accent: "pink",
    matches: (paper) => matchesEditorialTopic(paper, "multimodal", () => paper.topics.includes("vision-multimodal-generation")),
  },
  {
    slug: "systems",
    label: "Systems and efficiency",
    shortLabel: "Systems",
    description: "Inference, training, architecture, memory, serving, and the systems work that makes frontier AI practical.",
    artwork: topicArtUrl("systems"),
    accent: "cyan",
    matches: (paper) => matchesEditorialTopic(paper, "systems", () => paper.topics.includes("systems-efficiency")),
  },
  {
    slug: "robotics",
    label: "Robotics and embodied AI",
    shortLabel: "Robotics",
    description: "Models that perceive, navigate, manipulate, and learn through physical or simulated environments.",
    artwork: topicArtUrl("robotics"),
    accent: "yellow",
    matches: (paper) => matchesEditorialTopic(paper, "robotics", () => paper.topics.includes("robotics-embodied-ai")),
  },
  {
    slug: "science",
    label: "Science and medicine",
    shortLabel: "Science",
    description: "AI research applied to discovery, biology, medicine, materials, mathematics, and the scientific process.",
    artwork: topicArtUrl("science"),
    accent: "violet",
    matches: (paper) => matchesEditorialTopic(paper, "science", () => paper.topics.includes("science-medicine")),
  },
];

export function getTopic(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export function getTopicPapers<T extends TopicPaper>(topic: TopicDefinition, papers: T[]) {
  return papers.filter(topic.matches);
}

export function getPaperEditorialTopics(paper: TopicPaper) {
  return topics.filter((topic) => topic.matches(paper));
}
