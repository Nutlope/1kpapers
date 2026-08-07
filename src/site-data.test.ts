import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { createPaperDatabase, type PaperDataset } from "./paper-database.js";
import { buildSiteData, buildSiteIndexes, classifyEditorialTopics, type SitePaper } from "./site-data.js";

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
    editorialTopics: ["systems"],
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
  it("keeps editorial reasoning and agent topics narrower than the raw combined tag", () => {
    assert.deepEqual(classifyEditorialTopics({
      title: "DINOv3",
      abstract: "A self-supervised vision foundation model with dense visual features and text alignment.",
      topics: ["llms-agents-reasoning", "vision-multimodal-generation"],
    }), ["multimodal"]);

    assert.deepEqual(classifyEditorialTopics({
      title: "Reasoning with verifiable rewards",
      abstract: "We study reinforcement learning with verifiable rewards for mathematical reasoning.",
      topics: ["llms-agents-reasoning"],
    }), ["reasoning"]);

    assert.deepEqual(classifyEditorialTopics({
      title: "A long-horizon coding agent",
      abstract: "An agentic system for tool-use workflows.",
      topics: ["llms-agents-reasoning"],
    }), ["agents"]);
  });

  it("precomputes homepage rankings and compact catalog summaries", () => {
    const papers = [
      paper({ id: "arxiv-2512.02556", title: "Editorial anchor", citations: 4, githubRepository: "https://github.com/lab/anchor", githubStars: 20 }),
      paper({ id: "arxiv-highly-cited", title: "Highly cited", citations: 100, githubRepository: "https://github.com/lab/high", githubStars: 10 }),
      paper({ id: "arxiv-second", title: "Second", citations: 80, githubRepository: "https://github.com/lab/second", githubStars: 50 }),
      paper({ id: "arxiv-third", title: "Third", citations: 60 }),
      paper({ id: "arxiv-fourth", title: "Fourth", citations: 40 }),
    ];
    const { catalogData, homepageData, mostCitedData, mostStarredData } = buildSiteIndexes(papers, "2026-08-07T00:00:00Z");

    assert.equal(homepageData.trending[0]?.id, "arxiv-2512.02556");
    assert.equal(homepageData.mostCited[0]?.id, "arxiv-highly-cited");
    assert.equal(homepageData.mostCited.length, 3);
    assert.equal(mostCitedData.papers.length, 5);
    assert.equal(mostCitedData.paperCount, 5);
    assert.equal(mostStarredData.papers[0]?.id, "arxiv-second");
    assert.equal(mostStarredData.paperCount, 3);
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

  it("keeps each generated index within its payload budget", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "smartpdfs-site-data-"));
    const databasePath = path.join(directory, "papers.sqlite");
    const snapshot = JSON.parse(await readFile(path.join(process.cwd(), "metadata/papers.json"), "utf8")) as PaperDataset;
    createPaperDatabase(snapshot, databasePath);
    const { catalogData, homepageData, mostCitedData, mostStarredData } = await buildSiteData(process.cwd(), databasePath);

    assert.ok(Buffer.byteLength(JSON.stringify(catalogData)) < 2_000_000);
    assert.ok(Buffer.byteLength(JSON.stringify(homepageData)) < 50_000);
    assert.ok(Buffer.byteLength(JSON.stringify(mostCitedData)) < 500_000);
    assert.ok(Buffer.byteLength(JSON.stringify(mostStarredData)) < 500_000);
    await rm(directory, { recursive: true, force: true });
  });
});
