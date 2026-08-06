import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "../../../components/icons";
import { GreekCyberArt } from "../../../components/greek-cyber-art";
import { SiteHeader } from "../../../components/site-header";
import { formatCompactNumber, formatMonthYear, getPaper, topicLabel } from "../../../lib/papers";

type PaperPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PaperPageProps): Promise<Metadata> {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) return {};
  return {
    title: paper.title,
    description: paper.summary.slice(0, 155),
  };
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { id } = await params;
  const paper = await getPaper(id);
  if (!paper) notFound();

  const summaryPoints = paper.summary.split(/(?<=[.!?])\s+/).filter(Boolean);

  return (
    <main>
      <SiteHeader />
      <article className="paper-page page-shell">
        <header className="paper-page-header">
          <div className="paper-breadcrumb mono-label">
            <Link href="/">The year</Link><span>/</span><span>{paper.lab ?? "Independent research"}</span>
          </div>
          <div className="paper-title-block">
            <p className="mono-label">Paper {paper.arxivId ?? paper.id}</p>
            <h1 className="display-serif text-balance">{paper.title}</h1>
            <p className="paper-byline">
              {paper.authors.slice(0, 12).join(", ")}
              {paper.authors.length > 12 ? ", et al." : ""}
            </p>
          </div>
          <div className="paper-page-art"><GreekCyberArt /></div>
          <dl className="paper-stat-row">
            <div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div>
            <div><dt>Research lab</dt><dd>{paper.lab ?? "Independent"}</dd></div>
            <div><dt>Citations</dt><dd>{formatCompactNumber(paper.citations)}</dd></div>
            <div><dt>GitHub</dt><dd>{paper.githubStars !== null ? `${formatCompactNumber(paper.githubStars)} stars` : "Not linked"}</dd></div>
          </dl>
        </header>

        <div className="paper-page-grid">
          <aside className="paper-page-aside">
            <div>
              <p className="mono-label">Topics</p>
              <ul>{paper.topics.map((topic) => <li key={topic}>{topicLabel(topic)}</li>)}</ul>
            </div>
            <div>
              <p className="mono-label">Publication</p>
              <dl>
                <dt>Venue</dt><dd>{paper.venue ?? "Not indexed"}</dd>
                <dt>Pages</dt><dd>{paper.pageCount ?? "Not indexed"}</dd>
                <dt>DOI</dt><dd>{paper.doi ?? "Not indexed"}</dd>
                <dt>License</dt><dd>{paper.license ?? "Not indexed"}</dd>
              </dl>
            </div>
            <div className="paper-actions">
              <a href={paper.landingUrl} target="_blank" rel="noreferrer">Read original <ExternalIcon /></a>
              {paper.githubRepository ? <a href={paper.githubRepository} target="_blank" rel="noreferrer">View code <ExternalIcon /></a> : null}
              {paper.projectPage ? <a href={paper.projectPage} target="_blank" rel="noreferrer">Project page <ExternalIcon /></a> : null}
            </div>
          </aside>

          <section className="paper-reading-column">
            <div className="reading-section">
              <p className="mono-label"><span>01</span> In brief</p>
              <h2 className="display-serif">Summary</h2>
              <div className="summary-lede">
                {summaryPoints.map((point, index) => <p key={`${index}-${point}`}>{point}</p>)}
              </div>
            </div>

            <div className="reading-section">
              <p className="mono-label"><span>02</span> From the paper</p>
              <h2 className="display-serif">Abstract</h2>
              <p className="paper-abstract-full text-pretty">{paper.abstract ?? "No abstract was available from the public paper record."}</p>
            </div>
          </section>

          <aside className="paper-oracle-note">
            <div className="oracle-crop"><GreekCyberArt compact /></div>
            <p className="mono-label">Research thread</p>
            <h2 className="display-serif">Place this paper in the year</h2>
            <p>Follow its lab, ideas, references, and open-source implementation across the wider atlas.</p>
            <Link href="/#collections" className="signal-link">Explore the collection <ArrowIcon /></Link>
          </aside>
        </div>
      </article>
      <footer className="site-footer page-shell">
        <span>together.ai / research</span>
        <span>1,000 papers. One year in motion.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}
