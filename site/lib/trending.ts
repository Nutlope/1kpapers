import type { Paper } from "./paper-shared";

// Editorial anchors for the year, ordered for the homepage carousel. These
// balance citation impact, official-code adoption, recency, and field-wide
// significance instead of duplicating the Hugging Face upvote leaderboard.
const editorialTrendingIds = [
  "arxiv-2512.02556", // DeepSeek-V3.2
  "arxiv-2602.02276", // Kimi K2.5
  "arxiv-2511.21631", // Qwen3-VL
  "arxiv-2508.10104", // DINOv3
  "arxiv-2511.16719", // SAM 3
  "arxiv-2602.15763", // GLM-5
  "arxiv-2510.18234", // DeepSeek-OCR
  "arxiv-2607.24653", // Kimi K3
  "arxiv-2509.04664", // Why Language Models Hallucinate
] as const;

export function selectTrendingPapers(papers: Paper[], limit = editorialTrendingIds.length) {
  const byId = new Map(papers.map((paper) => [paper.id, paper]));
  const selected = editorialTrendingIds
    .map((id) => byId.get(id))
    .filter((paper): paper is Paper => Boolean(paper));
  const selectedIds = new Set(selected.map((paper) => paper.id));

  if (selected.length < limit) {
    const fallback = papers
      .filter((paper) => !selectedIds.has(paper.id))
      .sort((a, b) => breakthroughScore(b) - breakthroughScore(a));
    selected.push(...fallback.slice(0, limit - selected.length));
  }

  return selected.slice(0, limit);
}

function breakthroughScore(paper: Paper) {
  const citations = Math.log1p(paper.citations ?? 0) * 5;
  const githubAdoption = Math.log1p(paper.githubStars ?? 0) * 2;
  const communityInterest = Math.log1p(paper.upvotes ?? 0);
  return citations + githubAdoption + communityInterest;
}
