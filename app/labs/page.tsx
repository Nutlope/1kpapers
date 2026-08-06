import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon } from "../../components/icons";
import { LabLogo } from "../../components/lab-mark";
import { SiteHeader } from "../../components/site-header";
import { labs } from "../../lib/labs";
import { getPaperData } from "../../lib/papers";

export const metadata: Metadata = {
  title: "Research labs",
  description: "Explore the research labs represented across the year in AI papers.",
};

export default async function LabsPage() {
  const { papers } = await getPaperData();

  return (
    <main>
      <SiteHeader />
      <section className="labs-hero page-shell">
        <p className="mono-label">Research institutions</p>
        <h1 className="display-serif text-balance">The labs building the frontier.</h1>
        <p>Browse every paper in the collection by its verified research organization.</p>
      </section>
      <section className="lab-index-grid page-shell">
        {labs.map((lab, index) => {
          const labPapers = papers.filter((paper) => paper.lab === lab.name);
          if (labPapers.length === 0) return null;
          const citations = labPapers.reduce((total, paper) => total + (paper.citations ?? 0), 0);
          return (
            <Link key={lab.slug} href={`/labs/${lab.slug}`} className="lab-index-card focus-ring">
              <span className="topic-card-number">{String(index + 1).padStart(2, "0")}</span>
              <div className="lab-index-copy">
                <LabLogo lab={lab.name} className="lab-index-logo" />
                <p className="mono-label">Research lab</p>
                <h2 className="display-serif">{lab.shortName}</h2>
                <p>{lab.description}</p>
              </div>
              <dl><div><dt>Papers</dt><dd>{labPapers.length}</dd></div><div><dt>Citations</dt><dd>{citations}</dd></div></dl>
              <span>View papers <ArrowIcon /></span>
            </Link>
          );
        })}
      </section>
      <footer className="site-footer page-shell"><span>together.ai / research</span><span>1,000 papers. One year in motion.</span><Link href="/">Return to the atlas ↑</Link></footer>
    </main>
  );
}
