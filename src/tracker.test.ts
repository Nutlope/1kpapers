// Selection rules for the rolling tracker. These pin the decisions that are
// easy to regress quietly: what counts as a "new model", how repeat Daily
// Papers rows collapse, and when the writer must refuse to overwrite.

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  arxivIdsFromTags,
  authHeaders,
  fineTunedFrom,
  isDerivativeRepack,
  linkPapersToModels,
  mergeModels,
  mergePapers,
  minimumItems,
  toTrackedModel,
  toTrackedPaper,
  validateTrackerItems,
  writeFilesTogether,
  type HfModelRow,
} from "./tracker.js";

const now = new Date("2026-10-09T12:00:00Z");

function model(overrides: Partial<HfModelRow> = {}): HfModelRow {
  return {
    id: "acme/Acme-7B",
    author: "acme",
    createdAt: "2026-10-01T00:00:00Z",
    likes: 10,
    downloads: 100,
    trendingScore: 50,
    pipeline_tag: "text-generation",
    tags: ["license:apache-2.0", "arxiv:2510.01234"],
    safetensors: { total: 7_000_000_000 },
    cardData: { license: "apache-2.0" },
    ...overrides,
  };
}

test("keeps a recent original release with its metadata", () => {
  const tracked = toTrackedModel(model(), now, 120);
  assert.ok(tracked);
  assert.equal(tracked.parameters, 7_000_000_000);
  assert.equal(tracked.license, "apache-2.0");
  assert.equal(tracked.derivedFrom, null);
  assert.deepEqual(tracked.arxivIds, ["2510.01234"]);
  assert.equal(tracked.url, "https://huggingface.co/acme/Acme-7B");
});

test("drops quantized, adapter and merge repacks but keeps fine-tunes", () => {
  for (const relation of ["quantized", "adapter", "merge"]) {
    const row = model({ tags: [`base_model:${relation}:acme/Acme-7B`] });
    assert.equal(isDerivativeRepack(row.tags), true);
    assert.equal(toTrackedModel(row, now, 120), null, relation);
  }
  const fineTune = toTrackedModel(model({ tags: ["base_model:finetune:Qwen/Qwen3-8B"] }), now, 120);
  assert.equal(fineTune?.derivedFrom, "Qwen/Qwen3-8B");
  assert.equal(fineTunedFrom(["base_model:Qwen/Qwen3-8B"]), null);
});

test("drops models outside the window, private repos and incomplete rows", () => {
  assert.equal(toTrackedModel(model({ createdAt: "2026-01-01T00:00:00Z" }), now, 120), null);
  assert.equal(toTrackedModel(model({ createdAt: "2026-12-01T00:00:00Z" }), now, 120), null);
  assert.equal(toTrackedModel(model({ private: true }), now, 120), null);
  const noPipeline = model();
  delete noPipeline.pipeline_tag;
  assert.equal(toTrackedModel(noPipeline, now, 120), null);
  assert.equal(toTrackedModel(model({ createdAt: "not a date" }), now, 120), null);
});

test("ignores malformed arXiv tags instead of throwing", () => {
  assert.deepEqual(arxivIdsFromTags(["arxiv:hep-th/9901001", "arxiv:2510.01234v2", "arxiv:2510.01234"]), ["2510.01234"]);
});

test("merges pipeline lists without duplicates, ordered by trending", () => {
  const a = toTrackedModel(model({ id: "a/one", trendingScore: 10 }), now, 120)!;
  const b = toTrackedModel(model({ id: "b/two", trendingScore: 90 }), now, 120)!;
  const merged = mergeModels([[a, b], [b]], 10);
  assert.deepEqual(merged.map((m) => m.id), ["b/two", "a/one"]);
  assert.equal(mergeModels([[a, b]], 1).length, 1);
});

function dailyRow(id: string, upvotes: number, publishedAt = "2026-10-05T00:00:00Z") {
  return { paper: { id, title: `Paper ${id}`, summary: "An abstract about reasoning agents.", publishedAt, upvotes, authors: [{ name: "A. Author" }] } };
}

test("collapses repeat Daily Papers rows to the highest upvote count", () => {
  const start = new Date("2026-09-09T00:00:00Z");
  const rows = [dailyRow("2510.00001", 5), dailyRow("2510.00001", 40), dailyRow("2510.00002", 20)];
  const papers = rows.map((row) => toTrackedPaper(row as never, start, now)).filter((p) => p !== null);
  const merged = mergePapers(papers, 10);
  assert.deepEqual(merged.map((p) => [p.arxivId, p.hfUpvotes]), [["2510.00001", 40], ["2510.00002", 20]]);
  assert.equal(merged[0]!.hfUrl, "https://huggingface.co/papers/2510.00001");
});

test("drops papers outside the window or with unusable ids", () => {
  const start = new Date("2026-09-09T00:00:00Z");
  assert.equal(toTrackedPaper(dailyRow("2401.00001", 9, "2024-01-02T00:00:00Z") as never, start, now), null);
  assert.equal(toTrackedPaper(dailyRow("not-an-id", 9) as never, start, now), null);
});

test("links a paper to tracked models whose cards cite it", () => {
  const start = new Date("2026-09-09T00:00:00Z");
  const paper = toTrackedPaper(dailyRow("2510.01234", 3) as never, start, now)!;
  const tracked = toTrackedModel(model(), now, 120)!;
  assert.deepEqual(linkPapersToModels([paper], [tracked])[0]!.linkedModelIds, ["acme/Acme-7B"]);
});

test("validator rejects thin or duplicated results so the writer keeps old data", () => {
  assert.deepEqual(validateTrackerItems(["a", "b", "c"], 2, (x) => x), []);
  assert.match(validateTrackerItems(["a"], 2, (x) => x).join(), /only 1 items/);
  assert.match(validateTrackerItems(["a", "a", "b"], 2, (x) => x).join(), /duplicate keys: a/);
});

test("the token only goes to huggingface.co, never a custom --hub-base", () => {
  assert.deepEqual(authHeaders(new URL("https://huggingface.co/api/models"), "secret"), { Authorization: "Bearer secret" });
  assert.deepEqual(authHeaders(new URL("http://127.0.0.1:9/api/models"), "secret"), {});
  assert.deepEqual(authHeaders(new URL("https://huggingface.co.evil.test/api/models"), "secret"), {});
  assert.deepEqual(authHeaders(new URL("https://huggingface.co/api/models"), null), {});
});

test("a small requested limit lowers the thin-run floor instead of always failing", () => {
  assert.equal(minimumItems(10, 60), 10);
  assert.equal(minimumItems(10, 5), 5);
  assert.deepEqual(validateTrackerItems(["a", "b", "c", "d", "e"], minimumItems(10, 5), (x) => x), []);
  assert.match(validateTrackerItems(["a", "b", "c", "d"], minimumItems(10, 5), (x) => x).join(), /only 4 items/);
});

test("a failure staging the second file leaves the previous pair byte-identical", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "tracker-pair-"));
  try {
    const models = path.join(dir, "models.json");
    const papers = path.join(dir, "papers.json");
    await writeFile(models, "old models\n");
    await writeFile(papers, "old papers\n");
    const digest = async (file: string) => createHash("sha256").update(await readFile(file)).digest("hex");
    const before = [await digest(models), await digest(papers)];

    let writes = 0;
    const failingWrite = async (file: string, data: string) => {
      writes += 1;
      if (writes === 2) throw new Error("disk full");
      await writeFile(file, data);
    };
    await assert.rejects(
      writeFilesTogether([{ target: models, content: "new models\n" }, { target: papers, content: "new papers\n" }], { writeFile: failingWrite, rename, rm }, "test"),
      /disk full/,
    );

    assert.deepEqual([await digest(models), await digest(papers)], before);
    assert.deepEqual((await readdir(dir)).sort(), ["models.json", "papers.json"]);

    await writeFilesTogether([{ target: models, content: "new models\n" }, { target: papers, content: "new papers\n" }], { writeFile, rename, rm }, "test");
    assert.equal(await readFile(models, "utf8"), "new models\n");
    assert.equal(await readFile(papers, "utf8"), "new papers\n");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a GGUF upload self-labelled as a finetune is still a repack", () => {
  assert.equal(isDerivativeRepack(["gguf", "base_model:finetune:Qwen/Qwen3-VL-8B-Instruct"]), true);
  assert.equal(isDerivativeRepack(["mlx", "safetensors"]), true);
  assert.equal(isDerivativeRepack(["safetensors", "base_model:finetune:Qwen/Qwen3-8B"]), false);
});
