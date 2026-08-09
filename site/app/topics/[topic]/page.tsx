import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "../../../components/icons";
import { SiteHeader } from "../../../components/site-header";
import { TogetherResearchLink } from "../../../components/together-research-link";
import { TopicStrip } from "../../../components/topic-strip";
import { labDisplayName } from "../../../lib/labs";
import { formatCompactNumber, formatMonthYear, getPaperCatalog } from "../../../lib/papers";
import { getSection, getSectionPapers, getTopic, getTopicPapers } from "../../../lib/topics";
import { absoluteSiteUrl } from "../../../lib/site-url";

type TopicPageProps = {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
};

const PAGE_SIZE = 50;

type ResolvedCollection = {
  kind: "topic" | "section";
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
  artwork: string;
  children: Array<{ slug: string; label: string }>;
};

/**
 * A slug is either one of the precise editorial topics or one of the sections
 * that group them. Serving both keeps the original `/topics/reasoning` URLs
 * working now that the vocabulary is finer-grained.
 */
function resolveCollection(slug: string): ResolvedCollection | undefined {
  const topic = getTopic(slug);
  if (topic) {
    return { kind: "topic", slug, label: topic.label, shortLabel: topic.shortLabel, description: topic.description, accent: topic.accent, artwork: topic.artwork, children: [] };
  }
  const section = getSection(slug);
  if (section) {
    return {
      kind: "section",
      slug,
      label: section.label,
      shortLabel: section.label,
      description: `Every collection across ${section.label.toLowerCase()}.`,
      accent: section.accent,
      artwork: section.artwork,
      children: section.topics.map((child) => ({ slug: child.slug, label: child.label })),
    };
  }
  return undefined;
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = resolveCollection(slug);
  if (!topic) return {};
  const title = `${topic.label} AI papers`;
  const canonicalUrl = absoluteSiteUrl(`/topics/${slug}`);
  return {
    title,
    description: topic.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      title,
      description: topic.description,
      url: canonicalUrl,
      images: [{ url: topic.artwork, alt: `${topic.label} research collection` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: topic.description,
      images: [topic.artwork],
    },
  };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const [{ topic: slug }, { sort, page: pageParam }] = await Promise.all([params, searchParams]);
  const topic = resolveCollection(slug);
  if (!topic) notFound();

  const { papers } = await getPaperCatalog();
  const topicPapers = topic.kind === "section"
    ? getSectionPapers(topic.slug, papers)
    : getTopicPapers({ slug: topic.slug }, papers);
  const sorted = [...topicPapers].sort((a, b) => {
    if (sort === "cited") return (b.citations ?? 0) - (a.citations ?? 0);
    if (sort === "upvoted") return (b.upvotes ?? 0) - (a.upvotes ?? 0);
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });
  const labs = new Set(topicPapers.map((paper) => paper.lab).filter(Boolean)).size;
  const repositories = topicPapers.filter((paper) => paper.githubRepository).length;
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Number.parseInt(pageParam ?? "1", 10);
  if (!Number.isInteger(page) || page < 1 || page > pageCount) notFound();
  const pageStart = (page - 1) * PAGE_SIZE;
  const displayed = sorted.slice(pageStart, pageStart + PAGE_SIZE);
  const pageEnd = pageStart + displayed.length;
  const childTopics = topic.children.map((child) => ({
    slug: child.slug,
    label: child.label,
    count: getTopicPapers(child, papers).length,
  }));

  return (
    <main>
      <SiteHeader />
      <section className={`topic-detail-hero topic-${topic.accent} page-shell`}>
        <div className="paper-breadcrumb topic-breadcrumb mono-label"><Link href="/">The year</Link><span>/</span><Link href="/topics">Topics</Link><span>/</span><span>{topic.shortLabel}</span></div>
        <div className="paper-title-block topic-page-title">
          <p className="mono-label">{topic.kind === "section" ? "Topic area" : "Research collection"}</p>
          <h1 className="display-serif text-balance">{topic.label}</h1>
          <p>{topic.description}</p>
        </div>
        <div className="paper-page-art topic-page-art" aria-hidden="true">
          <div className="topic-art-frame">
            <Image src={topic.artwork} alt="" fill priority sizes="(max-width: 720px) 100vw, 30vw" />
          </div>
        </div>
        {topic.children.length > 0 ? (
          <nav className="topic-section-children" aria-label={`${topic.label} collections`}>
            <TopicStrip topics={childTopics} />
          </nav>
        ) : null}
        <dl className="paper-stat-row topic-stat-row">
          <div><dt>Papers</dt><dd>{topicPapers.length}</dd></div>
          <div><dt>Research labs</dt><dd>{labs}</dd></div>
          <div><dt>Official code</dt><dd>{repositories}</dd></div>
        </dl>
      </section>

      <section className="topic-results page-shell">
        <div className="topic-results-bar">
          <p><strong>{pageStart + 1}–{pageEnd}</strong> of {topicPapers.length} papers in this {topic.kind === "section" ? "topic area" : "collection"}</p>
          <nav aria-label="Sort papers">
            <Link className={!sort || sort === "newest" ? "active" : ""} href={`/topics/${slug}`}>Newest</Link>
            <Link className={sort === "cited" ? "active" : ""} href={`/topics/${slug}?sort=cited`}>Most cited</Link>
            <Link className={sort === "upvoted" ? "active" : ""} href={`/topics/${slug}?sort=upvoted`}>Most upvoted</Link>
          </nav>
        </div>
        <div className="topic-paper-list">
          {displayed.map((paper, index) => (
            <article key={paper.id} className="topic-paper-row">
              <span className="topic-paper-rank">{String(pageStart + index + 1).padStart(2, "0")}</span>
              <div className="topic-paper-main">
                <p className="mono-label">{labDisplayName(paper.lab) ?? paper.venue ?? "Independent research"}</p>
                <h2 className="display-serif"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h2>
                <p>{paper.summary}</p>
                <span>{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ", et al." : ""}</span>
              </div>
              <dl className="topic-paper-facts">
                <div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div>
                <div><dt>Citations</dt><dd>{formatCompactNumber(paper.citations)}</dd></div>
                <div><dt>Code</dt><dd>{paper.githubStars !== null ? `${formatCompactNumber(paper.githubStars)} stars` : "Not linked"}</dd></div>
              </dl>
              <div className="topic-paper-links">
                <Link href={`/papers/${paper.id}`}>Read summary <ArrowIcon /></Link>
                <a href={paper.landingUrl} target="_blank" rel="noreferrer">Original <ExternalIcon /></a>
              </div>
            </article>
          ))}
        </div>
        {pageCount > 1 ? (
          <nav className="collection-pagination" aria-label={`${topic.label} result pages`}>
            {page > 1 ? <Link href={topicPageHref(slug, sort, page - 1)}>← Previous</Link> : <span aria-disabled="true">← Previous</span>}
            <strong>Page {page} of {pageCount}</strong>
            {page < pageCount ? <Link href={topicPageHref(slug, sort, page + 1)}>Next →</Link> : <span aria-disabled="true">Next →</span>}
          </nav>
        ) : null}
      </section>
      <footer className="site-footer page-shell">
        <TogetherResearchLink />
        <span>Curated AI research, organized by topic.</span>
        <Link href="/topics">All topics ↑</Link>
      </footer>
    </main>
  );
}

function topicPageHref(slug: string, sort: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (sort && sort !== "newest") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/topics/${slug}${query ? `?${query}` : ""}`;
}
