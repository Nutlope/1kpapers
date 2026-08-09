import Link from "next/link";
import { ArrowIcon } from "../components/icons";
import { FeaturedCarousel } from "../components/featured-carousel";
import { LabMark } from "../components/lab-mark";
import { PersonalPaperPick } from "../components/personal-paper-pick";
import { SiteHeader } from "../components/site-header";
import { TogetherResearchLink } from "../components/together-research-link";
import { TopicStrip } from "../components/topic-strip";
import { YearExplorer, type MonthEntry } from "../components/year-explorer";
import { monthDefinitions } from "../lib/months";
import { formatMonthYear, getHomepageData, getPaperCatalog } from "../lib/papers";
import { getSectionPapers } from "../lib/topics";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "The Year in AI Papers",
    description: "Explore more than 1,000 papers in a curated atlas of artificial intelligence research.",
    url: "/",
  },
};

const featuredLabs = [
  { name: "OpenAI", slug: "openai" },
  { name: "Anthropic", slug: "anthropic" },
  { name: "Moonshot AI", slug: "moonshot-kimi" },
  { name: "DeepSeek", slug: "deepseek" },
  { name: "MiniMax", slug: "minimax" },
  { name: "Z.ai / GLM", slug: "zai-glm" },
] as const;

const homepageTopics = [
  { slug: "reasoning", label: "Reasoning" },
  { slug: "agents", label: "Agents" },
  { slug: "multimodal", label: "Multimodal" },
  { slug: "video-spatial", label: "Video" },
  { slug: "systems", label: "Systems" },
  { slug: "robotics", label: "Robotics" },
] as const;

const benchmarkCosts = [
  { model: "DeepSeek V4 Flash", totalUsd: 3.994620, perPaperUsd: 0.003995, relativeCost: "1.00×" },
  { model: "GPT-5.6 Luna", totalUsd: 6.003684, perPaperUsd: 0.006004, relativeCost: "1.50×" },
  { model: "Claude Haiku 4.5", totalUsd: 35.755200, perPaperUsd: 0.035755, relativeCost: "8.95×" },
] as const;

export default async function HomePage() {
  const [{ trending, mostCited, monthCounts }, { papers }] = await Promise.all([
    getHomepageData(),
    getPaperCatalog(),
  ]);
  const collectionPaperCount = papers.length;
  const additionalResearchPapers = Math.max(0, collectionPaperCount - 1_000);
  const monthEntries: MonthEntry[] = [...monthDefinitions].reverse().map((month) => ({
    key: month.key,
    month: month.month,
    year: month.year,
    count: monthCounts[month.key] ?? 0,
  }));
  // Keep the homepage index compact; the full eight-area taxonomy lives on
  // /topics. Short labels prevent the navigation from wrapping.
  const featuredTopics = homepageTopics.map((topic) => ({
    key: topic.slug,
    label: topic.label,
    count: getSectionPapers(topic.slug, papers).length,
  }));
  if (trending.length === 0) return null;

  return (
    <main>
      <SiteHeader />

      <section className="hero page-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="display-serif text-balance">
            <span>The year in AI</span>{" "}
            <span>papers</span>
          </h1>
          <p>1,000+ papers mapping AI research from 2025–2026.</p>
        </div>
      </section>

      <section className="lab-index page-shell" aria-labelledby="lab-index-title">
        <div className="lab-index-heading">
          <h2 id="lab-index-title" className="mono-label">Explore by research lab</h2>
          <Link href="/labs" className="signal-link section-action focus-ring">
            View all labs <ArrowIcon />
          </Link>
        </div>
        <div className="lab-list">
          {featuredLabs.map((lab) => (
            <Link key={lab.slug} href={`/labs/${lab.slug}`} className="focus-ring">
              <LabMark lab={lab.name} />
            </Link>
          ))}
        </div>
      </section>

      <section className="atlas-grid page-shell rule-top" id="collections">
        <aside className="topic-column">
          <h2 className="mono-label">Browse by topics</h2>
          <TopicStrip topics={featuredTopics.map((topic) => ({ ...topic, slug: topic.key }))} />
          <Link className="signal-link row-link section-action focus-ring" href="/topics">
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
            <Link className="signal-link row-link section-action focus-ring" href="/most-trending-papers">
              View all top papers <ArrowIcon />
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

      <YearExplorer months={monthEntries} totalCount={collectionPaperCount} totalLabel="1,000+" />

      <PersonalPaperPick papers={[...trending, ...mostCited]} />

      <section className="benchmark-costs page-shell rule-top" aria-labelledby="benchmark-cost-title">
        <div className="benchmark-cost-intro">
          <p className="mono-label">The cost benchmark</p>
          <h2 id="benchmark-cost-title" className="display-serif text-balance">What 1,000 summaries cost.</h2>
          <p className="text-pretty">Each model summarized the same extracted paper text with the same prompt, chunk boundaries, and output contract.</p>
        </div>
        <div className="benchmark-cost-results" role="list" aria-label="Completed-summary inference costs by model">
          {benchmarkCosts.map((result, index) => (
            <article key={result.model} className="benchmark-cost-row" role="listitem">
              <span className="mono-label">{String(index + 1).padStart(2, "0")}</span>
              <div className="benchmark-model">
                <h3 className="display-serif">{result.model}</h3>
                <p>1,000 / 1,000 completed</p>
              </div>
              <dl>
                <div>
                  <dt>Total inference</dt>
                  <dd className="tabular-nums">${result.totalUsd.toFixed(2)}</dd>
                </div>
                <div>
                  <dt>Per paper</dt>
                  <dd className="tabular-nums">${result.perPaperUsd.toFixed(3)}</dd>
                </div>
                <div>
                  <dt>Relative</dt>
                  <dd className="tabular-nums">{result.relativeCost}</dd>
                </div>
              </dl>
            </article>
          ))}
          <p className="benchmark-cost-note text-pretty">Completed-summary model inference only, using provider-reported token counts and standard prices frozen on August 5, 2026. This is a cost comparison, not a factual-quality ranking.</p>
        </div>
      </section>

      <section className="about-section page-shell" id="about" aria-labelledby="about-title">
        <div className="about-intro">
          <p className="mono-label">About &amp; methodology</p>
          <h2 id="about-title" className="display-serif text-balance">
            How we turned one year of AI research into a navigable atlas.
          </h2>
          <p className="about-deck text-pretty">
            The project began with a simple cost experiment: what would it take to summarize 1,000 real AI papers? We froze the inputs, ran a controlled model comparison, and shaped the results into this field guide.
          </p>
        </div>

        <div className="method-list">
          <article className="method-step">
            <span className="mono-label">01</span>
            <div>
              <h3 className="display-serif">Freeze a reproducible corpus</h3>
              <p className="text-pretty">
                We started with 8,262 discovery candidates from Hugging Face Daily Papers, guaranteed verified official research from five frontier labs, deduplicated by canonical arXiv ID, checked every version-pinned PDF, and froze exactly 1,000 papers published from August 4, 2025 through August 4, 2026.
              </p>
            </div>
          </article>

          <article className="method-step">
            <span className="mono-label">02</span>
            <div>
              <h3 className="display-serif">Read every PDF</h3>
              <p className="text-pretty">
                The final corpus contains 30,681 pages and 102.7 million extracted characters. Papers that fit the conservative context budget were summarized in one pass; oversized papers used a deterministic 50,000-character map-reduce flow instead of silent truncation.
              </p>
            </div>
          </article>

          <article className="method-step">
            <span className="mono-label">03</span>
            <div>
              <h3 className="display-serif">Hold the comparison constant</h3>
              <p className="text-pretty">
                DeepSeek V4 Flash, GPT-5.6 Luna, and Claude Haiku 4.5 received the same extracted text, chunk boundaries, prompt, and final-summary contract with reasoning disabled. Costs use provider-reported token counts and prices frozen on August 5, 2026.
              </p>
            </div>
          </article>

          <article className="method-step">
            <span className="mono-label">04</span>
            <div>
              <h3 className="display-serif">Build the research atlas</h3>
              <p className="text-pretty">
                We combined the 1,000-paper benchmark with {additionalResearchPapers.toLocaleString("en")} verified Together AI research papers, then added publication details, citations, official repositories, labs, and editorial topics to create this {collectionPaperCount.toLocaleString("en")}-paper atlas.
              </p>
            </div>
          </article>

          <p className="method-note text-pretty">
            This is a reproducible, popularity-weighted field guide and cost benchmark—not an exhaustive history of AI research or a factual-quality ranking. Reported costs cover model inference only; downloading, PDF extraction, storage, networking, and development time are excluded. Thank you to arXiv for use of its open access interoperability.
          </p>
        </div>
      </section>

      <footer className="site-footer page-shell">
        <TogetherResearchLink />
        <span className="footer-window"><b>Aug 2025 to Aug 2026</b><small>Last 12 months</small></span>
        <a href="#hero-title">Back to top ↑</a>
      </footer>
    </main>
  );
}
import type { Metadata } from "next";
