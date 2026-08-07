import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSiteData, buildSiteIndexes, type SitePaper } from "./site-data.js";

function paper(overrides: Partial<SitePaper> & Pick<SitePaper, "id" | "title">): SitePaper {
  const { id, title, ...rest } = overrides;
  return {
    id,
    arxivId: id.replace("arxiv-", ""),
    title,
    authors: ["Researcher"],
    abstract: "Full abstract",
    publishedAt: "2026-01-01T00:00:00.000Z",
    landingUrl: `https://arxiv.org/abs/${overrides.id}`,
    pdfUrl: null,
    pageCount: 10,
    topics: ["systems-efficiency"],
    categories: ["cs.LG"],
    upvotes: 10,
    summary: "Overview sentence with enough detail.\n\n- Result one.\n- Result two.",
    lab: null,
    citations: 0,
    githubRepository: null,
    githubStars: null,
    projectPage: null,
    doi: null,
    venue: "arXiv.org",
    license: null,
    ...rest,
  };
}

describe("generated site indexes", () => {
  it("precomputes homepage rankings and compact catalog summaries", () => {
    const papers = [
      paper({ id: "arxiv-2512.02556", title: "Editorial anchor", citations: 4 }),
      paper({ id: "arxiv-highly-cited", title: "Highly cited", citations: 100 }),
    ];
    const { catalogData, homepageData } = buildSiteIndexes(papers, "2026-08-07T00:00:00Z");

    assert.equal(homepageData.featured.id, "arxiv-2512.02556");
    assert.equal(homepageData.mostCited[0]?.id, "arxiv-highly-cited");
    assert.equal(homepageData.mostCitedCount, 2);
    assert.equal("abstract" in catalogData.papers[0]!, false);
    assert.doesNotMatch(catalogData.papers[0]?.summary ?? "", /Result one/);
  });

  it("ranks related papers by shared topics, categories, and lab", () => {
    const source = paper({ id: "arxiv-source", title: "Source", lab: "DeepSeek" });
    const sameLab = paper({ id: "arxiv-same-lab", title: "Same lab", lab: "DeepSeek" });
    const unrelated = paper({
      id: "arxiv-unrelated",
      title: "Unrelated",
      topics: ["science-medicine"],
      categories: ["q-bio.QM"],
      citations: 1_000,
    });
    const { relatedPapersById } = buildSiteIndexes([source, unrelated, sameLab], "2026-08-07T00:00:00Z");

    assert.equal(relatedPapersById.get(source.id)?.[0]?.id, sameLab.id);
    assert.ok(!relatedPapersById.get(source.id)?.some((paper) => paper.id === source.id));
  });

  it("keeps generated indexes below the Next.js two-megabyte cache limit", async () => {
    const { catalogData, homepageData } = await buildSiteData();

    assert.ok(Buffer.byteLength(JSON.stringify(catalogData)) < 2_000_000);
    assert.ok(Buffer.byteLength(JSON.stringify(homepageData)) < 2_000_000);
  });
});
