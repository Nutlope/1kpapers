import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../../components/icons";
import { GreekCyberArt } from "../../components/greek-cyber-art";
import { SiteHeader } from "../../components/site-header";
import { getPaperCatalog } from "../../lib/papers";
import { getTopicPapers, topics } from "../../lib/topics";

export const metadata: Metadata = {
  title: "Research topics",
  description: "Browse the ideas that defined the last year of AI research.",
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
          <p>Six editorial paths through 1,000 papers, from reasoning systems to scientific discovery.</p>
        </div>
        <GreekCyberArt compact />
      </section>

      <section className="topic-index-grid page-shell" aria-label="Research topics">
        {topics.map((topic, index) => {
          const topicPapers = getTopicPapers(topic, papers);
          const labs = new Set(topicPapers.map((paper) => paper.lab).filter(Boolean)).size;
          const repositories = topicPapers.filter((paper) => paper.githubRepository).length;
          return (
            <Link key={topic.slug} href={`/topics/${topic.slug}`} className={`topic-index-card topic-${topic.accent} focus-ring`}>
              <div className="topic-card-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="topic-index-copy">
                <p className="mono-label">Editorial collection</p>
                <h2 className="display-serif">{topic.label}</h2>
                <p>{topic.description}</p>
              </div>
              <div className="topic-index-art" aria-hidden="true">
                <Image src={topic.artwork} alt="" fill sizes="(max-width: 900px) 90vw, 45vw" />
              </div>
              <dl>
                <div><dt>Papers</dt><dd>{topicPapers.length}</dd></div>
                <div><dt>Labs</dt><dd>{labs}</dd></div>
                <div><dt>Code</dt><dd>{repositories}</dd></div>
              </dl>
              <span>Explore topic <ArrowIcon /></span>
            </Link>
          );
        })}
      </section>
      <footer className="site-footer page-shell">
        <span>together.ai / research</span>
        <span>1,000 papers. One year in motion.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}
