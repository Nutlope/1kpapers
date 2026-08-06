import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "../../../components/icons";
import { SiteHeader } from "../../../components/site-header";
import { formatCompactNumber, formatMonthYear, getPaperData } from "../../../lib/papers";
import { getTopic, getTopicPapers } from "../../../lib/topics";

type TopicPageProps = {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { topic: slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return {};
  return { title: topic.label, description: topic.description };
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const [{ topic: slug }, { sort }] = await Promise.all([params, searchParams]);
  const topic = getTopic(slug);
  if (!topic) notFound();

  const { papers } = await getPaperData();
  const topicPapers = getTopicPapers(topic, papers);
  const sorted = [...topicPapers].sort((a, b) => {
    if (sort === "cited") return (b.citations ?? 0) - (a.citations ?? 0);
    if (sort === "upvoted") return (b.upvotes ?? 0) - (a.upvotes ?? 0);
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });
  const labs = new Set(topicPapers.map((paper) => paper.lab).filter(Boolean)).size;
  const repositories = topicPapers.filter((paper) => paper.githubRepository).length;

  return (
    <main>
      <SiteHeader />
      <section className={`topic-detail-hero topic-${topic.accent} page-shell`}>
        <div className="topic-breadcrumb mono-label"><Link href="/">The year</Link><span>/</span><Link href="/topics">Topics</Link><span>/</span><span>{topic.shortLabel}</span></div>
        <div className="topic-title-row">
          <div>
            <p className="mono-label">Research collection</p>
            <h1 className="display-serif text-balance">{topic.label}</h1>
            <p>{topic.description}</p>
          </div>
          <dl>
            <div><dt>Papers</dt><dd>{topicPapers.length}</dd></div>
            <div><dt>Research labs</dt><dd>{labs}</dd></div>
            <div><dt>Official code</dt><dd>{repositories}</dd></div>
          </dl>
        </div>
      </section>

      <section className="topic-results page-shell">
        <div className="topic-results-bar">
          <p><strong>{topicPapers.length}</strong> papers in this collection</p>
          <nav aria-label="Sort papers">
            <Link className={!sort || sort === "newest" ? "active" : ""} href={`/topics/${slug}`}>Newest</Link>
            <Link className={sort === "cited" ? "active" : ""} href={`/topics/${slug}?sort=cited`}>Most cited</Link>
            <Link className={sort === "upvoted" ? "active" : ""} href={`/topics/${slug}?sort=upvoted`}>Most upvoted</Link>
          </nav>
        </div>
        <div className="topic-paper-list">
          {sorted.slice(0, 100).map((paper, index) => (
            <article key={paper.id} className="topic-paper-row">
              <span className="topic-paper-rank">{String(index + 1).padStart(2, "0")}</span>
              <div className="topic-paper-main">
                <p className="mono-label">{paper.lab ?? paper.venue ?? "Independent research"}</p>
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
      </section>
      <footer className="site-footer page-shell">
        <span>together.ai / research</span>
        <span>1,000 papers. One year in motion.</span>
        <Link href="/topics">All topics ↑</Link>
      </footer>
    </main>
  );
}
