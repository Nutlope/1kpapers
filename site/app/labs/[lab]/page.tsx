import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowIcon, ExternalIcon } from "../../../components/icons";
import { LabLogo } from "../../../components/lab-mark";
import { SiteHeader } from "../../../components/site-header";
import { getLabBySlug, labIncludesPaper } from "../../../lib/labs";
import { formatCompactNumber, formatMonthYear, getPaperCatalog } from "../../../lib/papers";
import { absoluteSiteUrl } from "../../../lib/site-url";

type LabPageProps = { params: Promise<{ lab: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: LabPageProps): Promise<Metadata> {
  const { lab: slug } = await params;
  const lab = getLabBySlug(slug);
  if (!lab) return {};
  const title = `${lab.shortName} AI research papers`;
  const canonicalUrl = absoluteSiteUrl(`/labs/${slug}`);
  return {
    title,
    description: lab.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      title,
      description: lab.description,
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: lab.description,
    },
  };
}

export default async function LabPage({ params, searchParams }: LabPageProps) {
  const [{ lab: slug }, { sort }] = await Promise.all([params, searchParams]);
  const lab = getLabBySlug(slug);
  if (!lab) notFound();
  const { papers } = await getPaperCatalog();
  const labPapers = papers.filter((paper) => labIncludesPaper(lab, paper.lab));
  const sorted = [...labPapers].sort((a, b) => {
    if (sort === "cited") return (b.citations ?? 0) - (a.citations ?? 0);
    if (sort === "upvoted") return (b.upvotes ?? 0) - (a.upvotes ?? 0);
    return Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  });
  const citations = labPapers.reduce((total, paper) => total + (paper.citations ?? 0), 0);
  const repositories = labPapers.filter((paper) => paper.githubRepository).length;

  return (
    <main>
      <SiteHeader />
      <section className="lab-detail-hero page-shell">
        <div className="topic-breadcrumb mono-label"><Link href="/">The year</Link><span>/</span><Link href="/labs">Labs</Link><span>/</span><span>{lab.shortName}</span></div>
        <div className="topic-title-row">
          <div className="lab-title-lockup">
            <LabLogo lab={lab.name} className="lab-detail-logo" />
            <div><p className="mono-label">Research lab</p><h1 className="display-serif text-balance">{lab.shortName}</h1><p>{lab.description}</p></div>
          </div>
          <dl><div><dt>Papers</dt><dd>{labPapers.length}</dd></div><div><dt>Citations</dt><dd>{formatCompactNumber(citations)}</dd></div><div><dt>Official code</dt><dd>{repositories}</dd></div></dl>
        </div>
      </section>
      <section className="topic-results page-shell">
        <div className="topic-results-bar"><p><strong>{labPapers.length}</strong> papers from {lab.shortName}</p><nav aria-label="Sort papers"><Link className={!sort || sort === "newest" ? "active" : ""} href={`/labs/${slug}`}>Newest</Link><Link className={sort === "cited" ? "active" : ""} href={`/labs/${slug}?sort=cited`}>Most cited</Link><Link className={sort === "upvoted" ? "active" : ""} href={`/labs/${slug}?sort=upvoted`}>Most upvoted</Link></nav></div>
        <div className="topic-paper-list">
          {sorted.map((paper, index) => (
            <article key={paper.id} className="topic-paper-row">
              <span className="topic-paper-rank">{String(index + 1).padStart(2, "0")}</span>
              <div className="topic-paper-main"><p className="mono-label">{paper.venue ?? "Research paper"}</p><h2 className="display-serif"><Link href={`/papers/${paper.id}`}>{paper.title}</Link></h2><p>{paper.summary}</p><span>{paper.authors.slice(0, 4).join(", ")}{paper.authors.length > 4 ? ", et al." : ""}</span></div>
              <dl className="topic-paper-facts"><div><dt>Published</dt><dd>{formatMonthYear(paper.publishedAt)}</dd></div><div><dt>Citations</dt><dd>{formatCompactNumber(paper.citations)}</dd></div><div><dt>Code</dt><dd>{paper.githubStars !== null ? `${formatCompactNumber(paper.githubStars)} stars` : "Not linked"}</dd></div></dl>
              <div className="topic-paper-links"><Link href={`/papers/${paper.id}`}>Read summary <ArrowIcon /></Link><a href={paper.landingUrl} target="_blank" rel="noreferrer">Original <ExternalIcon /></a></div>
            </article>
          ))}
        </div>
      </section>
      <footer className="site-footer page-shell"><span>together.ai / research</span><span>Curated AI research, organized by lab.</span><Link href="/labs">All labs ↑</Link></footer>
    </main>
  );
}
