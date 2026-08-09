import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "../../components/icons";
import { SiteHeader } from "../../components/site-header";
import { TogetherResearchLink } from "../../components/together-research-link";
import { monthDefinitions } from "../../lib/months";
import { getPaperCatalog } from "../../lib/papers";

export const metadata: Metadata = {
  title: "AI research timeline",
  description: "Browse the year in AI papers month by month.",
  alternates: { canonical: "/timeline" },
  openGraph: {
    type: "website",
    title: "AI research timeline",
    description: "Browse the year in AI papers month by month.",
    url: "/timeline",
  },
};

export default async function TimelinePage() {
  const { papers } = await getPaperCatalog();
  const months = [...monthDefinitions].reverse().map((month) => ({
    ...month,
    count: papers.filter((paper) => paper.publishedAt.startsWith(month.key)).length,
  }));

  return (
    <main>
      <SiteHeader />
      <section className="labs-hero page-shell">
        <p className="mono-label">Research timeline</p>
        <h1 className="display-serif text-balance">One year of AI, month by month.</h1>
        <p>Follow the papers and ideas that shaped each month from August 2025 through August 2026.</p>
      </section>
      <section className="timeline-index page-shell" aria-label="Monthly paper collections">
        {months.map((month, index) => (
          <Link key={month.key} href={`/months/${month.key}`} className="timeline-month focus-ring">
            <span className="topic-card-number">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <p className="mono-label">{month.year}</p>
              <h2 className="display-serif">{month.label}</h2>
            </div>
            <strong className="display-serif tabular-nums">{month.count}<small> papers</small></strong>
            <span className="signal-link">Explore month <ArrowIcon /></span>
          </Link>
        ))}
      </section>
      <footer className="site-footer page-shell"><TogetherResearchLink /><span>Thirteen months of AI research.</span><Link href="/">Return to the atlas ↑</Link></footer>
    </main>
  );
}
