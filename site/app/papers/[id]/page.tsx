import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "../../../components/icons";
import { JsonLd } from "../../../components/json-ld";
import { SiteHeader } from "../../../components/site-header";
import { TogetherResearchLink } from "../../../components/together-research-link";
import { getLabByName, labDisplayName } from "../../../lib/labs";
import { getPaperArtwork } from "../../../lib/paper-artwork";
import { parsePaperSummaryMarkdown } from "../../../lib/paper-summary";
import { buildScholarlyArticleJsonLd } from "../../../lib/paper-structured-data";
import { formatCompactNumber, formatMonthYear, getPaperDetails, resolvePaperRoute } from "../../../lib/papers";
import { paperHref } from "../../../lib/paper-url";
import { absoluteSiteUrl } from "../../../lib/site-url";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "../../../lib/social-metadata";
import { getPaperEditorialTopics } from "../../../lib/topics";

type PaperPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PaperPageProps): Promise<Metadata> {
  const { id } = await params;
  const route = await resolvePaperRoute(id);
  if (!route) return {};
  const details = await getPaperDetails(route.sourceId);
  if (!details) return {};
  const { paper } = details;
  const artwork = getPaperArtwork(route.sourceId);
  const description = paper.summary.slice(0, 155);
  const canonicalUrl = absoluteSiteUrl(`/papers/${route.slug}`);
  const metadataTitle = `${paper.title} — AI Paper Summary`;
  return {
    title: { absolute: metadataTitle },
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      title: metadataTitle,
      description,
      url: canonicalUrl,
      publishedTime: paper.publishedAt,
      images: artwork?.social
        ? [{ url: artwork.social, width: 1672, height: 941, alt: `Cover for ${paper.title}` }]
        : [DEFAULT_OPEN_GRAPH_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: metadataTitle,
      description,
      images: [artwork?.social ?? DEFAULT_TWITTER_IMAGE],
    },
  };
}

export default async function PaperPage({ params }: PaperPageProps) {
  const { id } = await params;
  const route = await resolvePaperRoute(id);
  if (!route) notFound();
  if (id !== route.slug) permanentRedirect(`/papers/${route.slug}`);

  const details = await getPaperDetails(route.sourceId);
  if (!details) notFound();
  const { paper, relatedPapers } = details;

  const summary = parsePaperSummaryMarkdown(paper.summary);
  const lab = getLabByName(paper.lab);
  const artwork = getPaperArtwork(route.sourceId);
  const editorialTopics = getPaperEditorialTopics(paper);
  const scholarlyArticle = buildScholarlyArticleJsonLd(paper, editorialTopics, artwork?.social, route.slug);

  return (
    <main>
      <JsonLd value={scholarlyArticle} />
      <SiteHeader />
      <article className="paper-page page-shell">
        <header className={`paper-page-header${artwork ? "" : " no-artwork"}`}>
          <div className="paper-breadcrumb mono-label">
            <Link href="/">The year</Link><span>/</span>{lab ? <Link href={`/labs/${lab.slug}`}>{lab.shortName}</Link> : <span>{paper.lab ?? "Independent research"}</span>}
          </div>
          <div className="paper-title-block">
            <p className="mono-label">Paper {paper.arxivId ?? paper.id}</p>
            <h1 className="display-serif text-balance">{paper.title}</h1>
            <p className="paper-byline">
              {paper.authors.slice(0, 12).join(", ")}
              {paper.authors.length > 12 ? ", et al." : ""}
            </p>
          </div>
          {artwork ? (
            <div className="paper-page-art">
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
            </div>
          ) : null}
          <dl className="paper-stat-row">
            <div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div>
            <div><dt>Research lab</dt><dd>{lab ? <Link href={`/labs/${lab.slug}`}>{lab.shortName} <ArrowIcon /></Link> : paper.lab ?? "Independent"}</dd></div>
            <div><dt>Citations</dt><dd>{formatCompactNumber(paper.citations)}</dd></div>
            <div><dt>GitHub</dt><dd>{paper.githubRepository && paper.githubStars !== null ? <a href={paper.githubRepository} target="_blank" rel="noreferrer">{formatCompactNumber(paper.githubStars)} stars <ExternalIcon /></a> : "Not linked"}</dd></div>
          </dl>
        </header>

        <div className="paper-page-grid">
          <aside className="paper-page-aside">
            {editorialTopics.length > 0 ? (
              <div>
                <p className="mono-label">Topics</p>
                <ul>{editorialTopics.map((topic) => <li key={topic.slug}><Link href={`/topics/${topic.slug}`}>{topic.label}</Link></li>)}</ul>
              </div>
            ) : null}
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
                    <span>{labDisplayName(related.lab) ?? related.venue ?? "Research paper"}</span>
                  </div>
                  <h3 className="display-serif text-balance">
                    <Link href={paperHref(related)}>{related.title}</Link>
                  </h3>
                  <p className="text-pretty">{related.summary}</p>
                  <div className="related-paper-footer">
                    <time dateTime={related.publishedAt}>{formatMonthYear(related.publishedAt)}</time>
                    <Link href={paperHref(related)}>Read summary <ArrowIcon /></Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </article>
      <footer className="site-footer page-shell">
        <TogetherResearchLink />
        <span>Research summaries from the AI paper atlas.</span>
        <Link href="/">Return to the atlas ↑</Link>
      </footer>
    </main>
  );
}
