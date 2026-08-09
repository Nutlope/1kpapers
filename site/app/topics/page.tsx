import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { TogetherResearchLink } from "../../components/together-research-link";
import { getPaperCatalog } from "../../lib/papers";
import { getSectionPapers, sections } from "../../lib/topics";

export const metadata: Metadata = {
  title: "Research topics",
  description: "Browse the ideas that defined the last year of AI research.",
  alternates: { canonical: "/topics" },
  openGraph: {
    type: "website",
    title: "Research topics",
    description: "Browse the ideas that defined the last year of AI research.",
    url: "/topics",
  },
};

export default async function TopicsPage() {
  const { papers } = await getPaperCatalog();

  return (
    <main>
      <SiteHeader />
      <section className="topics-hero page-shell">
        <div>
          <p className="mono-label">The research atlas</p>
          <h1 className="display-serif text-balance">Browse the ideas that shaped the year.</h1>
          <p>{sections.reduce((count, section) => count + section.topics.length, 0)} collections across {sections.length} topic areas, covering {papers.length.toLocaleString("en")} papers from reasoning systems to scientific discovery.</p>
        </div>
      </section>

      <section className="topic-index-grid page-shell" aria-label="Research topics">
        {sections.map((section, index) => {
          const sectionPapers = getSectionPapers(section.slug, papers);
          const labs = new Set(sectionPapers.map((paper) => paper.lab).filter(Boolean)).size;
          const repositories = sectionPapers.filter((paper) => paper.githubRepository).length;
          return (
            <Link
              key={section.slug}
              href={`/topics/${section.slug}`}
              className={`topic-index-card topic-${section.accent} focus-ring`}
              aria-label={`Explore ${section.label}: ${sectionPapers.length} papers`}
            >
              <div className="topic-card-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="topic-index-copy">
                <p className="mono-label">Topic area</p>
                <h2 className="display-serif">{section.label}</h2>
                <p className="topic-index-collection-count">
                  {section.topics.length} {section.topics.length === 1 ? "collection" : "collections"}
                </p>
              </div>
              <div className="topic-index-art" aria-hidden="true">
                <Image src={section.artwork} alt="" fill sizes="(max-width: 900px) 90vw, 45vw" />
              </div>
              <dl>
                <div><dt>Papers</dt><dd>{sectionPapers.length}</dd></div>
                <div><dt>Labs</dt><dd>{labs}</dd></div>
                <div><dt>Code</dt><dd>{repositories}</dd></div>
              </dl>
              <span>Explore topic <span aria-hidden="true">→</span></span>
            </Link>
          );
        })}
      </section>
      <footer className="site-footer page-shell">
        <TogetherResearchLink />
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}
