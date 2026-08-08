import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GreekCyberArt } from "../../components/greek-cyber-art";
import { SiteHeader } from "../../components/site-header";
import { getPaperCatalog } from "../../lib/papers";
import { getSectionPapers, getTopicPapers, sections } from "../../lib/topics";

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
          <p>{sections.reduce((count, section) => count + section.topics.length, 0)} collections across {sections.length} paths through {papers.length.toLocaleString("en")} papers, from reasoning systems to scientific discovery.</p>
        </div>
        <GreekCyberArt compact />
      </section>

      <section className="topic-index-grid page-shell" aria-label="Research topics">
        {sections.map((section, index) => {
          const sectionPapers = getSectionPapers(section.slug, papers);
          const labs = new Set(sectionPapers.map((paper) => paper.lab).filter(Boolean)).size;
          const repositories = sectionPapers.filter((paper) => paper.githubRepository).length;
          return (
            <article key={section.slug} className={`topic-index-card topic-${section.accent}`}>
              <div className="topic-card-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="topic-index-copy">
                <p className="mono-label">Editorial path</p>
                <h2 className="display-serif">{section.label}</h2>
                <ul className="topic-index-links">
                  {section.topics.map((topic) => (
                    <li key={topic.slug}>
                      <Link href={`/topics/${topic.slug}`} className="focus-ring">
                        {topic.label} <span>{getTopicPapers(topic, papers).length}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="topic-index-art" aria-hidden="true">
                <Image src={section.artwork} alt="" fill sizes="(max-width: 900px) 90vw, 45vw" />
              </div>
              <dl>
                <div><dt>Papers</dt><dd>{sectionPapers.length}</dd></div>
                <div><dt>Labs</dt><dd>{labs}</dd></div>
                <div><dt>Code</dt><dd>{repositories}</dd></div>
              </dl>
            </article>
          );
        })}
      </section>
      <footer className="site-footer page-shell">
        <span>together.ai / research</span>
        <span>{papers.length.toLocaleString("en")} papers. One research atlas.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}
