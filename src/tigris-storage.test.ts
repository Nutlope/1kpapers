import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { describe, it } from "node:test";
import {
  gzipJson,
  imageObjectKey,
  paperDatabaseUrl,
  paperSummaryObjectKey,
  publicObjectUrl,
  tigrisClientConfig,
} from "./tigris-storage.js";

describe("Tigris site storage", () => {
  it("groups paper and topic assets under stable IDs", () => {
    assert.equal(imageObjectKey("cover", "arxiv-2607.24653"), "papers/arxiv-2607.24653/cover.png");
    assert.equal(imageObjectKey("social", "arxiv-2607.24653", ".webp"), "papers/arxiv-2607.24653/social.webp");
    assert.equal(imageObjectKey("topic", "reasoning"), "topics/reasoning/art.png");
    assert.equal(paperSummaryObjectKey("arxiv-2607.24653"), "papers/arxiv-2607.24653/summary.json");
  });

  it("rejects IDs that could escape their object prefix", () => {
    assert.throws(() => imageObjectKey("cover", "../paper"), /Invalid image ID/);
    assert.throws(() => paperSummaryObjectKey("paper/id"), /Invalid paper ID/);
  });

  it("creates gzip JSON that round trips", () => {
    const { body } = gzipJson({ paper: { id: "arxiv-2607.24653" } });
    assert.deepEqual(JSON.parse(gunzipSync(body).toString()), { paper: { id: "arxiv-2607.24653" } });
  });

  it("prefers the explicit Tigris credentials and endpoint", () => {
    const config = tigrisClientConfig({
      TIGRIS_STORAGE_ACCESS_KEY_ID: "tigris-access",
      TIGRIS_STORAGE_SECRET_ACCESS_KEY: "tigris-secret",
      TIGRIS_STORAGE_ENDPOINT: "https://t3.storage.dev",
      AWS_ACCESS_KEY_ID: "aws-access",
      AWS_SECRET_ACCESS_KEY: "aws-secret",
      AWS_REGION: "auto",
    });
    assert.equal(config.endpoint, "https://t3.storage.dev");
    assert.equal(config.region, "auto");
    assert.deepEqual(config.credentials, { accessKeyId: "tigris-access", secretAccessKey: "tigris-secret" });
  });

  it("builds encoded public URLs", () => {
    assert.equal(
      publicObjectUrl("papers/arxiv-2607.24653/summary.json"),
      "https://year-in-ai-papers.t3.tigrisfiles.io/papers/arxiv-2607.24653/summary.json",
    );
    assert.equal(
      paperDatabaseUrl(),
      "https://year-in-ai-papers.t3.tigrisfiles.io/data/papers.sqlite",
    );
  });
});
