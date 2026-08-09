import type { Paper } from "./paper-shared";
import { topicArtUrl } from "./public-storage";
import { TOPIC_SECTIONS, TOPIC_TAXONOMY } from "./topic-taxonomy";

type TopicPaper = Pick<Paper, "topics"> & Partial<Pick<Paper, "editorialTopics" | "primaryTopic">>;

export type TopicDefinition = {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  section: string;
  accent: string;
  /** Every topic has its own cover; sections keep their own separate artwork. */
  artwork: string;
};

const sectionBySlug = new Map(TOPIC_SECTIONS.map((section) => [section.slug, section]));

export const topics: TopicDefinition[] = TOPIC_TAXONOMY.map((topic) => {
  const section = sectionBySlug.get(topic.section);
  return {
    slug: topic.slug,
    label: topic.label,
    shortLabel: topic.label,
    description: topic.description,
    section: topic.section,
    accent: section?.accent ?? "blue",
    artwork: topicArtUrl(topic.slug),
  };
});

export const sections = TOPIC_SECTIONS.map((section) => ({
  ...section,
  artwork: topicArtUrl(section.artworkSlug),
  topics: topics.filter((topic) => topic.section === section.slug),
}));

export function getTopic(slug: string) {
  return topics.find((topic) => topic.slug === slug);
}

export function getSection(slug: string) {
  return sections.find((section) => section.slug === slug);
}

/**
 * Topic membership comes only from the editorial assignment produced by
 * `pnpm topics:classify` + `pnpm topics:resolve`. There is deliberately no
 * keyword fallback: a classifier that silently changes its answer depending on
 * which page called it is worse than one that returns nothing.
 */
export function getTopicPapers<T extends TopicPaper>(topic: Pick<TopicDefinition, "slug">, papers: T[]) {
  return papers.filter((paper) => paper.primaryTopic === topic.slug);
}

/** A paper counts toward a section if any of its topics sit in that section. */
export function getSectionPapers<T extends TopicPaper>(sectionSlug: string, papers: T[]) {
  const slugs = new Set(topics.filter((topic) => topic.section === sectionSlug).map((topic) => topic.slug));
  return papers.filter((paper) => paper.primaryTopic !== null && paper.primaryTopic !== undefined && slugs.has(paper.primaryTopic));
}

export function getPaperEditorialTopics(paper: TopicPaper) {
  const assignedSlugs = paper.editorialTopics?.length
    ? paper.editorialTopics
    : paper.primaryTopic
      ? [paper.primaryTopic]
      : [];
  const topicsBySlug = new Map(topics.map((topic) => [topic.slug, topic]));
  return assignedSlugs.flatMap((slug) => {
    const topic = topicsBySlug.get(slug);
    return topic ? [topic] : [];
  });
}
