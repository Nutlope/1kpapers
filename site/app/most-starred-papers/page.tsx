import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "../../components/icons";
import { SiteHeader } from "../../components/site-header";
import { TogetherResearchLink } from "../../components/together-research-link";
import { labDisplayName } from "../../lib/labs";
import { formatCompactNumber, formatMonthYear, getMostStarredData } from "../../lib/papers";
import { paperHref } from "../../lib/paper-url";

export const metadata: Metadata = {
  title: "Most starred AI papers on GitHub",
  description: "AI papers with the most-starred linked GitHub repositories in the Year in AI Papers collection.",
  alternates: { canonical: "/most-starred-papers" },
  openGraph: {
    type: "website",
    title: "Most starred AI papers on GitHub",
    description: "AI papers with the most-starred linked GitHub repositories in the Year in AI Papers collection.",
    url: "/most-starred-papers",
  },
};

export default async function MostStarredPapersPage() {
  const { papers: displayed, paperCount, generatedAt } = await getMostStarredData();

  return (
    <main>
      <SiteHeader />
      <section className="ranking-hero page-shell">
        <div>
          <p className="mono-label">GitHub ranking / frozen snapshot</p>
          <h1 className="display-serif text-balance">The AI papers with the most GitHub stars.</h1>
          <p className="text-pretty">Linked repositories ranked by their snapshot star count, highlighting the research code that attracted the largest developer communities.</p>
        </div>
        <dl className="ranking-hero-stats">
          <div><dt>Linked papers</dt><dd className="tabular-nums">{paperCount}</dd></div>
          <div><dt>Showing</dt><dd className="tabular-nums">Top {displayed.length}</dd></div>
          <div><dt>Snapshot</dt><dd>{formatSnapshotDate(generatedAt)}</dd></div>
        </dl>
      </section>

      <section className="topic-results page-shell" aria-label="Most starred AI papers on GitHub">
        <div className="topic-results-bar">
          <p><strong>{displayed.length}</strong> papers ranked by GitHub stars</p>
          <span className="ranking-note mono-label">Star counts change over time</span>
        </div>
        <div className="topic-paper-list">
          {displayed.map((paper, index) => (
            <article key={paper.id} className="topic-paper-row">
              <span className="topic-paper-rank tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              <div className="topic-paper-main">
                <p className="mono-label">{labDisplayName(paper.lab) ?? paper.venue ?? "Independent research"}</p>
                <h2 className="display-serif text-balance"><Link href={paperHref(paper)}>{paper.title}</Link></h2>
                <p>{paper.summary}</p>
                <span>{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ", et al." : ""}</span>
              </div>
              <dl className="topic-paper-facts">
                <div><dt>GitHub stars</dt><dd className="tabular-nums">{formatCompactNumber(paper.githubStars)}</dd></div>
                <div><dt>Citations</dt><dd className="tabular-nums">{formatCompactNumber(paper.citations)}</dd></div>
                <div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div>
              </dl>
              <div className="topic-paper-links">
                <Link href={paperHref(paper)}>Read summary <ArrowIcon /></Link>
                <a href={paper.githubRepository!} target="_blank" rel="noreferrer">View on GitHub <ExternalIcon /></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer page-shell">
        <TogetherResearchLink />
        <span>GitHub stars are a time-bound snapshot.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}

function formatSnapshotDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
