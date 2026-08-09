import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "../../components/icons";
import { PaperCard } from "../../components/paper-card";
import { SiteHeader } from "../../components/site-header";
import { TogetherResearchLink } from "../../components/together-research-link";
import { labDisplayName } from "../../lib/labs";
import { formatCompactNumber, formatMonthYear, getHomepageData } from "../../lib/papers";
import { paperHref } from "../../lib/paper-url";
import { DEFAULT_OPEN_GRAPH_IMAGE } from "../../lib/social-metadata";

export const metadata: Metadata = {
  title: "Most trending AI papers",
  description: "The editorial selection of AI papers that moved the field forward from August 2025 through August 2026.",
  alternates: { canonical: "/most-trending-papers" },
  openGraph: {
    type: "website",
    title: "Most trending AI papers",
    description: "The editorial selection of AI papers that moved the field forward from August 2025 through August 2026.",
    url: "/most-trending-papers",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
};

export default async function MostTrendingPapersPage() {
  const { trending } = await getHomepageData();

  return (
    <main>
      <SiteHeader />
      <section className="ranking-hero page-shell">
        <div>
          <p className="mono-label">Editorial ranking / 2025–2026</p>
          <h1 className="display-serif text-balance">The papers that moved AI forward.</h1>
          <p className="text-pretty">Selected for citation impact, official-code adoption, recency, and field-wide significance.</p>
        </div>
        <dl className="ranking-hero-stats">
          <div><dt>Selected papers</dt><dd className="tabular-nums">{trending.length}</dd></div>
          <div><dt>Window</dt><dd>One year</dd></div>
          <div><dt>Method</dt><dd>Editorial</dd></div>
        </dl>
      </section>

      <section className="trending-ranking page-shell" aria-label="Most trending AI papers">
        {trending.map((paper, index) => (
          <article key={paper.id} className="trending-ranking-card">
            <div className="trending-cover-wrap">
              <span className="trending-rank tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <PaperCard paper={paper} accent={index % 3 === 0 ? "magenta" : index % 3 === 1 ? "yellow" : "cyan"} eager={index === 0} />
            </div>
            <div className="trending-ranking-copy">
              <p className="mono-label">{labDisplayName(paper.lab) ?? paper.venue ?? "Independent research"}</p>
              <h2 className="display-serif text-balance"><Link href={paperHref(paper)}>{paper.title}</Link></h2>
              <dl>
                <div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div>
                <div><dt>Citations</dt><dd className="tabular-nums">{formatCompactNumber(paper.citations)}</dd></div>
                <div><dt>Code</dt><dd className="tabular-nums">{paper.githubStars !== null ? `${formatCompactNumber(paper.githubStars)} stars` : "Not linked"}</dd></div>
              </dl>
              <Link className="signal-link ranking-card-link focus-ring" href={paperHref(paper)}>Read summary <ArrowIcon /></Link>
            </div>
          </article>
        ))}
      </section>

      <footer className="site-footer page-shell">
        <TogetherResearchLink />
        <span>Editorial signals, not a live popularity chart.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}
