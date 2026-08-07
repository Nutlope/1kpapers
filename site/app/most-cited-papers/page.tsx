import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "../../components/icons";
import { SiteHeader } from "../../components/site-header";
import { formatCompactNumber, formatMonthYear, getMostCitedData } from "../../lib/papers";

export const metadata: Metadata = {
  title: "Most cited AI papers",
  description: "The most cited papers in the Year in AI Papers collection, ranked from a frozen scholarly citation snapshot.",
  alternates: { canonical: "/most-cited-papers" },
  openGraph: {
    type: "website",
    title: "Most cited AI papers",
    description: "The most cited papers in the Year in AI Papers collection, ranked from a frozen scholarly citation snapshot.",
    url: "/most-cited-papers",
  },
};

export default async function MostCitedPapersPage() {
  const { papers: displayed, paperCount, generatedAt } = await getMostCitedData();

  return (
    <main>
      <SiteHeader />
      <section className="ranking-hero page-shell">
        <div>
          <p className="mono-label">Citation ranking / frozen snapshot</p>
          <h1 className="display-serif text-balance">The year’s most cited AI papers.</h1>
          <p className="text-pretty">A snapshot-ranked view of scholarly impact across the collection, separate from Hugging Face popularity.</p>
        </div>
        <dl className="ranking-hero-stats">
          <div><dt>Ranked papers</dt><dd className="tabular-nums">{paperCount}</dd></div>
          <div><dt>Showing</dt><dd className="tabular-nums">Top {displayed.length}</dd></div>
          <div><dt>Snapshot</dt><dd>{formatSnapshotDate(generatedAt)}</dd></div>
        </dl>
      </section>

      <section className="topic-results page-shell">
        <div className="topic-results-bar">
          <p><strong>{displayed.length}</strong> papers ranked by citation count</p>
          <span className="ranking-note mono-label">Counts change over time</span>
        </div>
        <div className="topic-paper-list">
          {displayed.map((paper, index) => (
            <article key={paper.id} className="topic-paper-row">
              <span className="topic-paper-rank tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <div className="topic-paper-main">
                <p className="mono-label">{paper.lab ?? paper.venue ?? "Independent research"}</p>
                <h2 className="display-serif"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h2>
                <p>{paper.summary}</p>
                <span>{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ", et al." : ""}</span>
              </div>
              <dl className="topic-paper-facts">
                <div><dt>Citations</dt><dd className="tabular-nums">{formatCompactNumber(paper.citations)}</dd></div>
                <div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div>
                <div><dt>Code</dt><dd className="tabular-nums">{paper.githubStars !== null ? `${formatCompactNumber(paper.githubStars)} stars` : "Not linked"}</dd></div>
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
        <span>Citation counts are a time-bound snapshot.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}

function formatSnapshotDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
