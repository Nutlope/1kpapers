import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "../../../components/icons";
import { SiteHeader } from "../../../components/site-header";
import { TogetherResearchLink } from "../../../components/together-research-link";
import { YearExplorer, type MonthEntry } from "../../../components/year-explorer";
import { labDisplayName } from "../../../lib/labs";
import { getMonthDefinition, monthDefinitions } from "../../../lib/months";
import { formatCompactNumber, formatMonthYear, getPaperCatalog } from "../../../lib/papers";
import { absoluteSiteUrl } from "../../../lib/site-url";

type MonthPageProps = { params: Promise<{ month: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: MonthPageProps): Promise<Metadata> {
  const { month: key } = await params;
  const month = getMonthDefinition(key);
  if (!month) return {};
  const title = `${month.label} AI papers`;
  const description = `The most discussed AI research papers published in ${month.label}.`;
  const canonicalUrl = absoluteSiteUrl(`/months/${key}`);
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: { type: "website", title, description, url: canonicalUrl },
  };
}

export default async function MonthPage({ params, searchParams }: MonthPageProps) {
  const [{ month: key }, { sort }] = await Promise.all([params, searchParams]);
  const month = getMonthDefinition(key);
  if (!month) notFound();

  const { papers } = await getPaperCatalog();
  const monthPapers = papers.filter((paper) => paper.publishedAt.startsWith(month.key));
  const sorted = [...monthPapers].sort((a, b) => {
    if (sort === "newest") return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
    if (sort === "cited") return (b.citations ?? 0) - (a.citations ?? 0);
    return (b.upvotes ?? 0) - (a.upvotes ?? 0);
  });
  const citations = monthPapers.reduce((total, paper) => total + (paper.citations ?? 0), 0);
  const labCount = new Set(monthPapers.map((paper) => paper.lab).filter(Boolean)).size;
  const monthEntries: MonthEntry[] = monthDefinitions.map((entry) => ({
    key: entry.key,
    month: entry.month,
    year: entry.year,
    count: papers.filter((paper) => paper.publishedAt.startsWith(entry.key)).length,
  }));

  return (
    <main>
      <SiteHeader />
      <section className="lab-detail-hero month-detail-hero page-shell">
        <div className="topic-breadcrumb mono-label"><Link href="/">The year</Link><span>/</span><span>{month.label}</span></div>
        <div className="topic-title-row">
          <div><p className="mono-label">Monthly collection</p><h1 className="display-serif text-balance">{month.label}</h1><p>The papers that drew the most attention during this month of AI research.</p></div>
          <dl><div><dt>Papers</dt><dd>{monthPapers.length}</dd></div><div><dt>Citations</dt><dd>{formatCompactNumber(citations)}</dd></div><div><dt>Research labs</dt><dd>{labCount}</dd></div></dl>
        </div>
      </section>
      <YearExplorer months={monthEntries} selectedMonth={month.key} openInNewTab={false} />
      <section className="topic-results page-shell">
        <div className="topic-results-bar">
          <p><strong>{monthPapers.length}</strong> papers published in {month.label}</p>
          <nav aria-label="Sort papers">
            <Link className={!sort || sort === "trending" ? "active" : ""} href={`/months/${key}`}>Trending</Link>
            <Link className={sort === "newest" ? "active" : ""} href={`/months/${key}?sort=newest`}>Newest</Link>
            <Link className={sort === "cited" ? "active" : ""} href={`/months/${key}?sort=cited`}>Most cited</Link>
          </nav>
        </div>
        <div className="topic-paper-list">
          {sorted.map((paper, index) => (
            <article key={paper.id} className="topic-paper-row">
              <span className="topic-paper-rank">{String(index + 1).padStart(2, "0")}</span>
              <div className="topic-paper-main"><p className="mono-label">{labDisplayName(paper.lab) ?? paper.venue ?? "Research paper"}</p><h2 className="display-serif"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h2><p>{paper.summary}</p><span>{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ", et al." : ""}</span></div>
              <dl className="topic-paper-facts"><div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div><div><dt>Upvotes</dt><dd>{formatCompactNumber(paper.upvotes)}</dd></div><div><dt>Citations</dt><dd>{formatCompactNumber(paper.citations)}</dd></div></dl>
              <div className="topic-paper-links"><Link href={`/papers/${paper.id}`}>Read summary <ArrowIcon /></Link><a href={paper.landingUrl} target="_blank" rel="noreferrer">Original <ExternalIcon /></a></div>
            </article>
          ))}
        </div>
      </section>
      <footer className="site-footer page-shell"><TogetherResearchLink /><span>{month.label} in AI</span><Link href="/">Return to the year ↑</Link></footer>
    </main>
  );
}
