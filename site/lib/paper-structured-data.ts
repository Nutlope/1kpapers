import type { Paper } from "./papers";
import { absoluteSiteUrl } from "./site-url";
import type { TopicDefinition } from "./topics";

export function buildScholarlyArticleJsonLd(
  paper: Paper,
  topics: TopicDefinition[],
  imageUrl?: string | null,
) {
  const canonicalUrl = absoluteSiteUrl(`/papers/${paper.id}`);
  const identifiers = [
    paper.arxivId ? { "@type": "PropertyValue", propertyID: "arXiv", value: paper.arxivId } : null,
    paper.doi ? { "@type": "PropertyValue", propertyID: "DOI", value: paper.doi } : null,
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    headline: paper.title,
    name: paper.title,
    description: paper.summary,
    abstract: paper.abstract ?? undefined,
    author: paper.authors.map((name) => ({ "@type": "Person", name })),
    datePublished: paper.publishedAt,
    url: canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    sameAs: paper.landingUrl,
    identifier: identifiers,
    pagination: paper.pageCount ? String(paper.pageCount) : undefined,
    license: paper.license ?? undefined,
    image: imageUrl ?? undefined,
    about: topics.map((topic) => ({ "@type": "Thing", name: topic.label })),
    publisher: {
      "@type": "Organization",
      name: "Together AI",
      url: "https://www.together.ai/",
    },
    isPartOf: {
      "@type": "CollectionPage",
      name: "The Year in AI Papers",
      url: absoluteSiteUrl("/"),
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
