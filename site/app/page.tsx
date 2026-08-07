import Image from "next/image";
import Link from "next/link";
import { ArrowIcon } from "../components/icons";
import { FeaturedCarousel } from "../components/featured-carousel";
import { GreekCyberArt } from "../components/greek-cyber-art";
import { LabMark } from "../components/lab-mark";
import { PaperCard } from "../components/paper-card";
import { PaperSearch } from "../components/paper-search";
import { SiteHeader } from "../components/site-header";
import { YearExplorer, type MonthEntry } from "../components/year-explorer";
import { monthDefinitions } from "../lib/months";
import { formatMonthYear, getPaperData, type Paper } from "../lib/papers";
import { topicArtUrl } from "../lib/public-storage";
import { selectTrendingPapers } from "../lib/trending";

const featuredLabs = [
  { name: "OpenAI", slug: "openai" },
  { name: "Anthropic", slug: "anthropic" },
  { name: "Moonshot AI", slug: "moonshot-kimi" },
  { name: "DeepSeek", slug: "deepseek" },
  { name: "MiniMax", slug: "minimax" },
  { name: "Z.ai / GLM", slug: "zai-glm" },
] as const;
export default async function HomePage() {
  const { papers } = await getPaperData();
  const mostCited = [...papers]
    .filter((paper) => paper.citations !== null)
    .sort((a, b) => (b.citations ?? 0) - (a.citations ?? 0));
  const trending = selectTrendingPapers(papers);
  const lead = trending[0] ?? papers[0];
  const topicCounts = countTopics(papers);
  const monthEntries: MonthEntry[] = monthDefinitions.map((month) => ({
    key: month.key,
    month: month.month,
    year: month.year,
    count: papers.filter((paper) => paper.publishedAt.startsWith(month.key)).length,
  }));
  const agentCount = papers.filter((paper) =>
    /\bagents?\b|\bagentic\b|tool use|computer use/i.test(`${paper.title} ${paper.summary}`),
  ).length;
  const reasoningCount = papers.filter((paper) =>
    /\breasoning\b|chain.of.thought|reinforcement learning|test.time|inference.time/i.test(`${paper.title} ${paper.summary}`),
  ).length;
  const editorialTopics = [
    { key: "reasoning", label: "Reasoning", count: reasoningCount },
    { key: "agents", label: "Agents", count: agentCount },
    { key: "vision-multimodal-generation", label: "Multimodal", count: topicCounts.get("vision-multimodal-generation") ?? 0 },
    { key: "systems-efficiency", label: "Systems", count: topicCounts.get("systems-efficiency") ?? 0 },
    { key: "robotics-embodied-ai", label: "Robotics", count: topicCounts.get("robotics-embodied-ai") ?? 0 },
    { key: "science-medicine", label: "Science", count: topicCounts.get("science-medicine") ?? 0 },
  ];

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
        </div>
      </section>

      <section className="lab-index page-shell" aria-labelledby="lab-index-title">
        <h2 id="lab-index-title" className="mono-label">
          Explore by research lab
        </h2>
        <div className="lab-list">
          {featuredLabs.map((lab) => (
            <Link key={lab.slug} href={`/labs/${lab.slug}`} className="focus-ring">
              <LabMark lab={lab.name} />
            </Link>
          ))}
        </div>
        <Link href="/labs" className="signal-link index-link focus-ring">
          View all labs <ArrowIcon />
        </Link>
      </section>

      <section className="atlas-grid page-shell rule-top" id="collections">
        <aside className="topic-column">
          <h2 className="mono-label">Browse by topic</h2>
          <ol>
            {editorialTopics.map((topic, index) => (
              <li key={topic.key}>
                <Link href={`/topics/${topic.key}`} className="focus-ring">
                  <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="display-serif">{topic.label}</span>
                  <small className="tabular-nums">{topic.count}</small>
                </Link>
              </li>
            ))}
          </ol>
          <Link className="signal-link row-link focus-ring" href="/topics">
            View all topics <ArrowIcon />
          </Link>
        </aside>

        <section className="featured-story">
          <div className="story-copy">
            <p className="mono-label"><span>01</span> Trending this year</p>
            <h2 className="display-serif text-balance">The papers that moved AI forward</h2>
            <p className="story-description text-pretty">
              Selected for citation impact, official-code adoption, recency, and field-wide significance.
            </p>
            <Link className="signal-link row-link focus-ring" href="/most-trending-papers">
              Explore the top papers <ArrowIcon />
            </Link>
          </div>
          <FeaturedCarousel papers={trending} />
        </section>

        <aside className="popular-column">
          <div className="column-heading">
            <h2 className="mono-label">Most cited</h2>
            <span className="mono-label">Citations</span>
          </div>
          <ol>
            {mostCited.slice(0, 3).map((paper, index) => (
              <li key={paper.id}>
                <span className="topic-index">{String(index + 1).padStart(2, "0")}</span>
                <Link href={`/papers/${paper.id}`} className="focus-ring">
                  <strong>{paper.title}</strong>
                  <small>{formatMonthYear(paper.publishedAt)}</small>
                </Link>
                <span className="upvote tabular-nums">{paper.citations}</span>
              </li>
            ))}
          </ol>
          <Link className="signal-link row-link focus-ring" href="/most-cited-papers">
            View top 100 <ArrowIcon />
          </Link>
        </aside>
      </section>

      <YearExplorer months={monthEntries} />

      <section className="shelves page-shell rule-top" id="shelves" aria-labelledby="shelves-title">
        <div className="section-line">
          <h2 id="shelves-title" className="mono-label">Editorial shelves</h2>
          <Link href="/topics" className="focus-ring">View all shelves →</Link>
        </div>
        <div className="shelf-grid">
          <ShelfCard title="Reasoning" count={reasoningCount} artwork={topicArtUrl("reasoning")} slug="reasoning" />
          <ShelfCard title="Agents" count={agentCount} artwork={topicArtUrl("agents")} slug="agents" />
          <ShelfCard title="Multimodal" count={topicCounts.get("vision-multimodal-generation") ?? 0} artwork={topicArtUrl("multimodal")} slug="multimodal" />
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

      <footer className="site-footer page-shell">
        <span>together.ai / research</span>
        <span className="footer-window"><b>Aug 2025 to Aug 2026</b><small>Last 12 months</small></span>
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

function ShelfCard({ title, count, artwork, slug }: { title: string; count: number; artwork: string; slug: string }) {
  return (
    <Link className="shelf-card focus-ring" href={`/topics/${slug}`}>
      <div>
        <strong className="mono-label">{title}</strong>
        <small>{count} papers</small>
        <span>◉ &nbsp; Explore &nbsp; →</span>
      </div>
      <Image className="shelf-art" src={artwork} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" />
    </Link>
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
