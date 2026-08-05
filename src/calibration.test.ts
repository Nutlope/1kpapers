import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("calibration worksheet spans labs, topics, and document lengths", async () => {
  const fixtures = JSON.parse(
    await readFile("corpus/calibration-15.json", "utf8"),
  ) as {
    officialLab: string | null;
    topicTags: string[];
    pages: number;
    reviewStatus: string;
  }[];
  assert.equal(fixtures.length, 15);
  const labs = Object.groupBy(
    fixtures.filter((fixture) => fixture.officialLab),
    (fixture) => fixture.officialLab!,
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(labs).map(([lab, papers]) => [lab, papers?.length])),
    {
      Anthropic: 2,
      DeepSeek: 2,
      MiniMax: 2,
      "Moonshot AI / Kimi": 2,
      OpenAI: 2,
    },
  );
  for (const topic of [
    "llms-agents-reasoning",
    "vision-multimodal-generation",
    "systems-efficiency",
    "robotics-embodied-ai",
    "science-medicine",
  ]) {
    assert.ok(fixtures.some((fixture) => fixture.topicTags.includes(topic)));
  }
  assert.ok(Math.min(...fixtures.map((fixture) => fixture.pages)) <= 15);
  assert.ok(Math.max(...fixtures.map((fixture) => fixture.pages)) >= 70);
  assert.ok(fixtures.every((fixture) => fixture.reviewStatus === "pending-human"));
});
