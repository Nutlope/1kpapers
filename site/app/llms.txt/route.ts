import { PAPER_CATALOG_URL, PAPER_DATABASE_URL, SEARCH_INDEX_URL } from "../../lib/public-storage";
import { absoluteSiteUrl } from "../../lib/site-url";

export function GET() {
  const body = `# The Year in AI Papers

> A Together AI research atlas containing more than 1,000 AI papers, concise summaries, original abstracts, citations, official code links, research labs, and editorial topics.

## Coverage

- Current publication window: August 2025 through August 2026.
- The atlas prioritizes widely discussed, high-impact papers from this period; it is not an exhaustive index of every AI paper.

## Primary pages

- [Research atlas](${absoluteSiteUrl("/")})
- [Topics](${absoluteSiteUrl("/topics")})
- [Research labs](${absoluteSiteUrl("/labs")})
- [Publication timeline](${absoluteSiteUrl("/timeline")})
- [Most trending papers](${absoluteSiteUrl("/most-trending-papers")})
- [Most cited papers](${absoluteSiteUrl("/most-cited-papers")})
- [Most starred papers](${absoluteSiteUrl("/most-starred-papers")})

## Machine-readable resources

- [XML sitemap](${absoluteSiteUrl("/sitemap.xml")})
- [Paper catalog JSON](${PAPER_CATALOG_URL})
- [Search index JSON](${SEARCH_INDEX_URL})
- [Canonical SQLite database](${PAPER_DATABASE_URL})

## Paper URLs

Paper pages use readable, stable title slugs, for example \`${absoluteSiteUrl("/papers/kimi-k2-5-visual-agentic-intelligence")}\`. Slugs are capped at 80 characters. Each page includes a human-readable summary, the original abstract and publication metadata, and ScholarlyArticle JSON-LD. Legacy source-ID URLs permanently redirect to the canonical title-slug URL. Prefer the paper's original arXiv or publisher link when verifying scientific claims.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
