import { readFile, writeFile } from "node:fs/promises";
import type { Source } from "./types.js";

type Profile = Source & { pages: number; characters: number; sha256: string };
const profiles = JSON.parse(
  await readFile("corpus/pilot-50-profile.json", "utf8"),
) as Profile[];
const selected = new Map<string, Profile>();

for (const papers of Object.values(
  Object.groupBy(
    profiles.filter((paper) => paper.officialLab),
    (paper) => paper.officialLab!,
  ),
)) {
  const byLength = [...(papers ?? [])].sort(
    (a, b) => a.characters - b.characters || a.id.localeCompare(b.id),
  );
  if (byLength[0]) selected.set(byLength[0].id, byLength[0]);
  if (byLength.at(-1)) selected.set(byLength.at(-1)!.id, byLength.at(-1)!);
}

const topics = [
  "llms-agents-reasoning",
  "vision-multimodal-generation",
  "systems-efficiency",
  "robotics-embodied-ai",
  "science-medicine",
];
for (const topic of topics) {
  const paper = profiles
    .filter(
      (candidate) =>
        !candidate.officialLab &&
        !selected.has(candidate.id) &&
        candidate.topicTags?.includes(topic),
    )
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))[0];
  if (paper) selected.set(paper.id, paper);
}

if (selected.size !== 15) {
  throw new Error(`Expected 15 calibration papers, selected ${selected.size}`);
}

const fixtures = [...selected.values()]
  .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity))
  .map((paper) => ({
    id: paper.id,
    title: paper.title,
    landingPage: paper.landingPage,
    officialLab: paper.officialLab ?? null,
    topicTags: paper.topicTags ?? [],
    pages: paper.pages,
    characters: paper.characters,
    sha256: paper.sha256,
    reviewStatus: "pending-human",
    checklist: {
      centralQuestion: "",
      mainContribution: "",
      strongestResults: [] as string[],
      limitations: [] as string[],
      qualificationRisks: [] as string[],
    },
  }));

await writeFile(
  "corpus/calibration-15.json",
  `${JSON.stringify(fixtures, null, 2)}\n`,
);
console.log("Wrote 15-paper human calibration worksheet");
