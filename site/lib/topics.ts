import type { Paper } from "./paper-shared";
import { topicArtUrl } from "./public-storage";

export type TopicDefinition = {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  artwork: string;
  accent: "blue" | "orange" | "pink" | "cyan" | "yellow" | "violet";
  matches: (paper: Pick<Paper, "title" | "summary" | "topics">) => boolean;
};

export const topics: TopicDefinition[] = [
  {
    slug: "reasoning",
    label: "Reasoning",
    shortLabel: "Reasoning",
    description: "Models that plan, verify, deliberate, and improve through inference-time or reinforcement-learning techniques.",
    artwork: topicArtUrl("reasoning"),
    accent: "blue",
    matches: (paper) => /\breasoning\b|chain.of.thought|reinforcement learning|test.time|inference.time/i.test(`${paper.title} ${paper.summary}`),
  },
  {
    slug: "agents",
    label: "Agents",
    shortLabel: "Agents",
    description: "Research on tool use, autonomous workflows, computer use, multi-agent coordination, and long-horizon action.",
    artwork: topicArtUrl("agents"),
    accent: "orange",
    matches: (paper) => /\bagents?\b|\bagentic\b|tool use|computer use|multi-agent/i.test(`${paper.title} ${paper.summary}`),
  },
  {
    slug: "multimodal",
    label: "Multimodal",
    shortLabel: "Multimodal",
    description: "Vision, audio, video, image generation, and models that reason across several kinds of media.",
    artwork: topicArtUrl("multimodal"),
    accent: "pink",
    matches: (paper) => paper.topics.includes("vision-multimodal-generation"),
  },
  {
    slug: "systems",
    label: "Systems and efficiency",
    shortLabel: "Systems",
    description: "Inference, training, architecture, memory, serving, and the systems work that makes frontier AI practical.",
    artwork: topicArtUrl("systems"),
    accent: "cyan",
    matches: (paper) => paper.topics.includes("systems-efficiency"),
  },
  {
    slug: "robotics",
    label: "Robotics and embodied AI",
    shortLabel: "Robotics",
    description: "Models that perceive, navigate, manipulate, and learn through physical or simulated environments.",
    artwork: topicArtUrl("robotics"),
    accent: "yellow",
    matches: (paper) => paper.topics.includes("robotics-embodied-ai"),
  },
  {
    slug: "science",
    label: "Science and medicine",
    shortLabel: "Science",
    description: "AI research applied to discovery, biology, medicine, materials, mathematics, and the scientific process.",
    artwork: topicArtUrl("science"),
    accent: "violet",
    matches: (paper) => paper.topics.includes("science-medicine"),
  },
];

export function getTopic(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export function getTopicPapers<T extends Pick<Paper, "title" | "summary" | "topics">>(topic: TopicDefinition, papers: T[]) {
  return papers.filter(topic.matches);
}
