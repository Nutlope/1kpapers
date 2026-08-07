import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "../../../components/icons";
import { GreekCyberArt } from "../../../components/greek-cyber-art";
import { SiteHeader } from "../../../components/site-header";
import { getLabByName } from "../../../lib/labs";
import { getPaperArtwork } from "../../../lib/paper-artwork";
import { parsePaperSummaryMarkdown } from "../../../lib/paper-summary";
import { formatCompactNumber, formatMonthYear, getPaperDetails, topicLabel } from "../../../lib/papers";

type PaperPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PaperPageProps): Promise<Metadata> {
  const { id } = await params;
  const details = await getPaperDetails(id);
  if (!details) return {};
  const { paper } = details;
  const artwork = getPaperArtwork(id);
  return {
    title: paper.title,
    description: paper.summary.slice(0, 155),
    openGraph: artwork?.social
      ? { images: [{ url: artwork.social, width: 1672, height: 941, alt: `Cover for ${paper.title}` }] }
      : undefined,
    twitter: artwork?.social
      ? { card: "summary_large_image", images: [artwork.social] }
      : undefined,
  };
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { id } = await params;
  const details = await getPaperDetails(id);
  if (!details) notFound();
  const { paper, relatedPapers } = details;

  const summary = parsePaperSummaryMarkdown(paper.summary);
  const lab = getLabByName(paper.lab);
  const artwork = getPaperArtwork(id);

  return (
    <main>
      <SiteHeader />
      <article className="paper-page page-shell">
        <header className="paper-page-header">
          <div className="paper-breadcrumb mono-label">
            <Link href="/">The year</Link><span>/</span>{lab ? <Link href={`/labs/${lab.slug}`}>{paper.lab}</Link> : <span>{paper.lab ?? "Independent research"}</span>}
          </div>
          <div className="paper-title-block">
            <p className="mono-label">Paper {paper.arxivId ?? paper.id}</p>
            <h1 className="display-serif text-balance">{paper.title}</h1>
            <p className="paper-byline">
              {paper.authors.slice(0, 12).join(", ")}
              {paper.authors.length > 12 ? ", et al." : ""}
            </p>
          </div>
          <div className="paper-page-art">
            {artwork ? (
              <div className="paper-cover-book">
                <Image
                  className="paper-page-cover"
                  src={artwork.cover}
                  alt={`Editorial cover for ${paper.title}`}
                  fill
                  priority
                  sizes="(max-width: 720px) 190px, (max-width: 1050px) 210px, 245px"
                />
              </div>
            ) : (
              <GreekCyberArt />
            )}
          </div>
          <dl className="paper-stat-row">
            <div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div>
            <div><dt>Research lab</dt><dd>{lab ? <Link href={`/labs/${lab.slug}`}>{lab.shortName} <ArrowIcon /></Link> : paper.lab ?? "Independent"}</dd></div>
            <div><dt>Citations</dt><dd>{formatCompactNumber(paper.citations)}</dd></div>
            <div><dt>GitHub</dt><dd>{paper.githubRepository && paper.githubStars !== null ? <a href={paper.githubRepository} target="_blank" rel="noreferrer">{formatCompactNumber(paper.githubStars)} stars <ExternalIcon /></a> : "Not linked"}</dd></div>
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
                {summary.paragraphs.map((paragraph, index) => (
                  <p className="text-pretty" key={`${index}-${paragraph}`}>{paragraph}</p>
                ))}
                {summary.bullets.length ? (
                  <ul>
                    {summary.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                ) : null}
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

        {relatedPapers.length ? (
          <section className="related-papers" id="related-papers" aria-labelledby="related-papers-title">
            <div className="related-papers-heading">
              <p className="mono-label">Continue exploring</p>
              <h2 id="related-papers-title" className="display-serif text-balance">Related papers</h2>
            </div>
            <div className="related-paper-grid">
              {relatedPapers.map((related, index) => (
                <article key={related.id} className="related-paper-card">
                  <div className="related-paper-meta">
                    <span className="mono-label">{String(index + 1).padStart(2, "0")}</span>
                    <span>{related.lab ?? related.venue ?? "Research paper"}</span>
                  </div>
                  <h3 className="display-serif text-balance">
                    <Link href={`/papers/${related.id}`}>{related.title}</Link>
                  </h3>
                  <p className="text-pretty">{related.summary}</p>
                  <div className="related-paper-footer">
                    <time dateTime={related.publishedAt}>{formatMonthYear(related.publishedAt)}</time>
                    <Link href={`/papers/${related.id}`}>Read summary <ArrowIcon /></Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </article>
      <footer className="site-footer page-shell">
        <span>together.ai / research</span>
        <span>1,000 papers. One year in motion.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}
