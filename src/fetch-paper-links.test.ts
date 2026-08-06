import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyRepository, findPaperEvidence, normalizeGithubRepository } from "./fetch-paper-links.js";

describe("paper link discovery", () => {
  it("normalizes GitHub repository URLs", () => {
    assert.equal(normalizeGithubRepository("https://github.com/DeepSeek-AI/DeepSeek-OCR.git#readme"), "DeepSeek-AI/DeepSeek-OCR");
    assert.equal(normalizeGithubRepository("github.com/MoonshotAI/Kimi-K2.5/tree/main"), "MoonshotAI/Kimi-K2.5");
    assert.equal(normalizeGithubRepository("https://example.com/owner/repo"), null);
  });

  it("finds exact paper evidence without matching a model-name mention", () => {
    const paper = {
      arxivId: "2510.18234",
      title: "DeepSeek-OCR: Contexts Optical Compression",
      landingUrl: "https://arxiv.org/abs/2510.18234v1",
    };
    const evidence = findPaperEvidence(
      paper,
      { description: "Official implementation of DeepSeek-OCR: Contexts Optical Compression", homepage: null },
      "Paper: https://arxiv.org/abs/2510.18234",
    );
    assert.deepEqual(new Set(evidence.map((item) => item.matchedBy)), new Set(["arxiv-id", "landing-url", "exact-title"]));
    assert.deepEqual(findPaperEvidence(paper, { description: "Tools for DeepSeek models", homepage: null }, ""), []);
  });

  it("does not promote unverified or community candidates", () => {
    assert.equal(classifyRepository({ owner: "deepseek-ai", hasRelationshipEvidence: true, hasCuratedRepositoryEvidence: false, isCommunityReproduction: false, repositoryIsPublic: true }), "verified");
    assert.equal(classifyRepository({ owner: "paper-author", hasRelationshipEvidence: true, hasCuratedRepositoryEvidence: false, isCommunityReproduction: false, repositoryIsPublic: true }), "strong");
    assert.equal(classifyRepository({ owner: "paper-author", hasRelationshipEvidence: false, hasCuratedRepositoryEvidence: false, isCommunityReproduction: false, repositoryIsPublic: true }), "candidate");
    assert.equal(classifyRepository({ owner: "paper-author", hasRelationshipEvidence: true, hasCuratedRepositoryEvidence: false, isCommunityReproduction: true, repositoryIsPublic: true }), "candidate");
    assert.equal(classifyRepository({ owner: "moonshotai", hasRelationshipEvidence: false, hasCuratedRepositoryEvidence: true, isCommunityReproduction: false, repositoryIsPublic: true }), "verified");
  });
});
