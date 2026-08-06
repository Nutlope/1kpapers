import Link from "next/link";
import { ArrowIcon } from "../components/icons";
import { GreekCyberArt } from "../components/greek-cyber-art";
import { LabMark } from "../components/lab-mark";
import { PaperCard } from "../components/paper-card";
import { PaperSearch } from "../components/paper-search";
import { SiteHeader } from "../components/site-header";
import { formatMonthYear, getPaperData, topicLabel, type Paper } from "../lib/papers";

const labs = ["OpenAI", "Anthropic", "Moonshot / Kimi", "DeepSeek", "MiniMax", "Z.ai / GLM"] as const;
const topicOrder = [
  "llms-agents-reasoning",
  "vision-multimodal-generation",
  "systems-efficiency",
  "robotics-embodied-ai",
  "science-medicine",
];

const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export default async function HomePage() {
  const { papers } = await getPaperData();
  const popular = [...papers]
    .filter((paper) => paper.upvotes !== null)
    .sort((a, b) => (b.upvotes ?? 0) - (a.upvotes ?? 0));
  const featured = popular.slice(0, 3);
  const lead = featured[0] ?? papers[0];
  const topicCounts = countTopics(papers);
  const agentCount = papers.filter((paper) =>
    /\bagents?\b|\bagentic\b|tool use|computer use/i.test(`${paper.title} ${paper.summary}`),
  ).length;

  if (!lead) return null;

  return (
    <main>
      <SiteHeader />

      <section className="hero page-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="display-serif text-balance">
            <span>The year in AI</span>{" "}
            <span>papers</span>
          </h1>
          <p>1,000 papers that defined the last year of AI.</p>
        </div>
        <div className="hero-art-wrap">
          <GreekCyberArt />
        </div>
        <div className="hero-tools">
          <PaperSearch />
          <div className="date-window mono-label">
            <span>Aug 2025 to Aug 2026</span>
            <span className="date-chip">Last 12 months</span>
          </div>
        </div>
      </section>

      <section className="lab-index page-shell" aria-labelledby="lab-index-title">
        <h2 id="lab-index-title" className="mono-label">
          Explore by research lab
        </h2>
        <div className="lab-list">
          {labs.map((lab) => (
            <a key={lab} href={`#lab-${lab.split(" ")[0]?.toLowerCase()}`} className="focus-ring">
              <LabMark lab={lab} />
            </a>
          ))}
        </div>
        <a href="#collections" className="signal-link index-link focus-ring">
          View all labs <ArrowIcon />
        </a>
      </section>

      <section className="atlas-grid page-shell rule-top" id="collections">
        <aside className="topic-column">
          <h2 className="mono-label">Browse by topic</h2>
          <ol>
            {topicOrder.map((topic, index) => (
              <li key={topic}>
                <a href={`#${topic}`} className="focus-ring">
                  <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="display-serif">{topicLabel(topic)}</span>
                  <small className="tabular-nums">{topicCounts.get(topic) ?? 0}</small>
                </a>
              </li>
            ))}
          </ol>
          <a className="signal-link row-link focus-ring" href="#shelves">
            View all topics <ArrowIcon />
          </a>
        </aside>

        <section className="featured-story">
          <div className="story-copy">
            <p className="mono-label"><span>01</span> Featured story</p>
            <h2 className="display-serif text-balance">The year reasoning became infrastructure</h2>
            <p className="story-description text-pretty">
              From stronger benchmarks to agentic workflows, reasoning moved from research frontier to system backbone.
            </p>
            <a className="signal-link row-link focus-ring" href="#featured-paper">
              Explore the story <ArrowIcon />
            </a>
          </div>
          <div className="featured-cards">
            {featured.map((paper, index) => (
              <PaperCard key={paper.id} paper={paper} accent={(["magenta", "yellow", "cyan"] as const)[index] ?? "magenta"} />
            ))}
          </div>
          <div className="carousel-nav" aria-hidden="true">
            <span>←</span>
            <i className="active" />
            <i />
            <i />
            <span>→</span>
          </div>
        </section>

        <aside className="popular-column">
          <div className="column-heading">
            <h2 className="mono-label">Most upvoted</h2>
            <span className="mono-label">HF upvotes</span>
          </div>
          <ol>
            {popular.slice(0, 3).map((paper, index) => (
              <li key={paper.id}>
                <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
                <Link href={`/papers/${paper.id}`} className="focus-ring">
                  <strong>{paper.title}</strong>
                  <small>{formatMonthYear(paper.publishedAt)}</small>
                </Link>
                <span className="upvote tabular-nums">{paper.upvotes}</span>
              </li>
            ))}
          </ol>
          <a className="signal-link row-link focus-ring" href="#featured-paper">
            View full list <ArrowIcon />
          </a>
        </aside>
      </section>

      <section className="year-explorer page-shell rule-top" aria-labelledby="year-title">
        <h2 id="year-title" className="mono-label">Explore the year</h2>
        <div className="month-track">
          {months.map((month, index) => (
            <div key={`${month}-${index}`} className={index === 0 ? "current" : ""}>
              <span>{month}</span>
              <small>{index < 5 ? "2025" : "2026"}</small>
              <i />
            </div>
          ))}
        </div>
        <div className="curated-count">
          <strong className="display-serif tabular-nums">1,000</strong>
          <span>papers<br /><small>curated and indexed</small></span>
        </div>
        <div className="filter-pills">
          <button className="focus-ring">All types <span>⌄</span></button>
          <button className="focus-ring">All venues <span>⌄</span></button>
        </div>
      </section>

      <section className="shelves page-shell rule-top" id="shelves" aria-labelledby="shelves-title">
        <div className="section-line">
          <h2 id="shelves-title" className="mono-label">Editorial shelves</h2>
          <a href="#collections" className="focus-ring">View all shelves →</a>
        </div>
        <div className="shelf-grid">
          <ShelfCard title="Reasoning" count={topicCounts.get("llms-agents-reasoning") ?? 0} art="labyrinth" />
          <ShelfCard title="Agents" count={agentCount} art="owl" />
          <ShelfCard title="Multimodal" count={topicCounts.get("vision-multimodal-generation") ?? 0} art="oracle" />
        </div>
      </section>

      <FeaturedPaper paper={lead} />

      <section className="about-section page-shell" id="about">
        <div>
          <p className="mono-label">About the collection</p>
          <h2 className="display-serif text-balance">A field guide to one fast-moving year.</h2>
        </div>
        <div className="about-copy">
          <p className="text-pretty">
            The Year in AI Papers is an editorial map of the research that shaped models, agents, multimodal systems, robotics, and science from August 2025 through August 2026.
          </p>
          <p className="text-pretty" id="methodology">
            Papers are collected from public research sources, enriched with citation and repository metadata, and summarized to make the year easier to navigate.
          </p>
        </div>
      </section>

      <footer className="site-footer page-shell" id="notes">
        <span>together.ai / research</span>
        <span>1,000 papers. One year in motion.</span>
        <a href="#hero-title">Back to top ↑</a>
      </footer>
    </main>
  );
}

function countTopics(papers: Paper[]) {
  const counts = new Map<string, number>();
  for (const paper of papers) {
    for (const topic of paper.topics) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  }
  return counts;
}

function ShelfCard({ title, count, art }: { title: string; count: number; art: "labyrinth" | "owl" | "oracle" }) {
  return (
    <a className={`shelf-card shelf-${art} focus-ring`} href="#featured-paper">
      <div>
        <strong className="mono-label">{title}</strong>
        <small>{count} papers</small>
        <span>◉ &nbsp; Explore &nbsp; →</span>
      </div>
      <GreekCyberArt compact />
    </a>
  );
}

function FeaturedPaper({ paper }: { paper: Paper }) {
  const points = paper.summary.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
  return (
    <article className="featured-paper page-shell" id="featured-paper">
      <PaperCard paper={paper} />
      <div className="feature-number"><span>01</span></div>
      <div className="feature-main">
        <h2 className="display-serif text-balance">{paper.title}</h2>
        <div className="authors-row">
          <span className="mono-label">Authors</span>
          <p>{paper.authors.join(", ")}</p>
        </div>
        <p className="feature-abstract text-pretty">{paper.abstract}</p>
      </div>
      <dl className="paper-facts">
        <div><dt>Venue</dt><dd>{paper.venue ?? "Independent release"}</dd></div>
        <div><dt>Pages</dt><dd>{paper.pageCount ?? "Not indexed"}</dd></div>
        <div><dt>Citations</dt><dd>{paper.citations ?? "Not indexed"}</dd></div>
        <div><dt>Code</dt><dd>{paper.githubStars !== null ? `${paper.githubStars} GitHub stars` : "No official repository"}</dd></div>
        <a href={paper.landingUrl} target="_blank" rel="noreferrer">View original paper <ArrowIcon /></a>
      </dl>
      <div className="summary-panel">
        <div className="summary-tabs"><span className="active">Summary</span><span>Method</span><span>Results</span></div>
        <ul>
          {points.map((point, index) => <li key={point}><span>{["▧", "▤", "⌘"][index]}</span><p>{point}</p></li>)}
        </ul>
      </div>
    </article>
  );
}
