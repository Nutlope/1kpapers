import assert from "node:assert/strict";
import test from "node:test";
import { chooseRepository, PAPER_PAGE_SUMMARY_MODEL_ID, resolveCitation, resolveOfficialLab, validateFinalDataset, type GithubRecord } from "./build-metadata.js";

function repository(overrides: Partial<GithubRecord>): GithubRecord {
  return {
    collectionId: "arxiv-1",
    accepted: true,
    repositoryUrl: "https://github.com/author/paper",
    githubStars: 10,
    githubStarsSnapshotAt: "2026-08-06T00:00:00Z",
    githubRepositoryEvidenceUrl: "https://github.com/author/paper#readme",
    githubRepositorySource: "huggingface-paper",
    repositoryConfidence: "strong",
    mappedOfficialLab: null,
    mappedOfficialLabEvidenceUrl: null,
    relationshipEvidence: [{ location: "readme", matchedBy: "arxiv-id" }],
    archived: false,
    ...overrides,
  };
}

test("chooses verified lab code before a more popular project repository", () => {
  const result = chooseRepository([
    repository({ githubStars: 50_000 }),
    repository({
      repositoryUrl: "https://github.com/deepseek-ai/paper",
      repositoryConfidence: "verified",
      mappedOfficialLab: "DeepSeek",
      githubStars: 100,
    }),
  ]);
  assert.equal(result?.repositoryUrl, "https://github.com/deepseek-ai/paper");
});

test("uses curated lab evidence before repository and organization mappings", () => {
  const lab = resolveOfficialLab({
    curatedLab: "OpenAI",
    curatedEvidenceUrl: "https://openai.com/research/paper",
    curatedSource: "curated-seed",
    githubRecords: [repository({ repositoryConfidence: "verified", mappedOfficialLab: "DeepSeek" })],
    huggingFace: {
      collectionId: "arxiv-1",
      retrievedAt: "2026-08-06T00:00:00Z",
      projectPage: null,
      mappedOfficialLab: "NVIDIA",
      mappedOfficialLabEvidenceUrl: "https://huggingface.co/papers/1",
    },
  });
  assert.equal(lab.officialLab, "OpenAI");
  assert.equal(lab.officialLabSource, "curated-seed");
  assert.equal(lab.officialLabConfidence, "verified");
});

test("uses exact OpenAlex fallback only when Semantic Scholar is missing", () => {
  const citation = resolveCitation(null, {
    collectionId: "arxiv-1",
    datacite: { status: "ok", doi: "10.1/test", retrievedAt: "2026-08-06T00:00:00Z", sourceUrl: null, explicitLicense: null },
    openAlex: {
      status: "ok",
      citationCount: 4,
      retrievedAt: "2026-08-06T00:00:00Z",
      sourceUrl: "https://api.openalex.org/works/1",
      openAlexId: "https://openalex.org/W1",
      venue: null,
    },
  }, "2026-08-06T00:00:00Z");
  assert.equal(citation.citationCount, 4);
  assert.equal(citation.citationSource, "openalex");
});

test("validates the exact collection cardinality and provenance", () => {
  const papers = Array.from({ length: 1_018 }, (_, index) => ({
    collectionId: index === 1_017 ? "openreview-parallel-kernel-bench" : `arxiv-${index}`,
    arxivId: index === 1_017 ? null : String(index),
    summaryModel: PAPER_PAGE_SUMMARY_MODEL_ID,
    citationCount: 0,
    citationSource: "semantic-scholar",
    citationSnapshotAt: "2026-08-06T00:00:00Z",
    githubRepository: null,
    githubStars: null,
    githubStarsSnapshotAt: null,
    officialLab: null,
    officialLabEvidenceUrl: null,
    officialLabConfidence: "unknown",
  }));
  assert.doesNotThrow(() => validateFinalDataset(papers));
});
