import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { TOPIC_TAXONOMY } from "./topic-taxonomy.js";

const run = promisify(execFile);

/**
 * Regenerates topic cover art in the site's house style: finely engraved
 * indigo linework on white, objects radiating around a centre, left third left
 * empty because the topic card fades that edge into the page background.
 *
 * Together returns JPEG, so each image is converted to PNG (the key the site
 * reads is `topics/{slug}/art.png`).
 */
const ENDPOINT = "https://api.together.xyz/v1/images/generations";
const MODEL = "black-forest-labs/FLUX.2-flex";
const WIDTH = 1_792;
const HEIGHT = 1_008;
const STEPS = 32;

const STYLE = [
  "Finely engraved technical illustration in the manner of a vintage scientific encyclopedia plate, rendered in indigo, blue and violet ink on pure bright white paper, with small cyan highlight accents.",
  "Dense fine cross-hatching, stippling and precise contour linework. Objects are detailed and volumetric, not flat icons.",
  "Composition: six or seven distinct objects arranged in a radiating cycle around one central object, joined by slender dashed arrow connectors. The entire left third of the frame is empty bright white paper with nothing drawn in it.",
  "Wide 16:9 horizontal format, pure white background, legible at thumbnail size.",
  "Absolutely no text, letters, numbers, gibberish writing, labels, captions, logos or watermarks.",
  // Paper, books and plates are the main source of leaked pseudo-lettering, so
  // every writing surface has to be called out as blank explicitly.
  "Every page, sheet, plate, spine, dial face and panel in the image is completely blank and unmarked. No writing, no glyphs, no inscriptions, no ruled text lines, no seals, no engraved lettering anywhere.",
  "No brain, no human head, no human figure, no photography, no glossy 3D render, no neon glow, no cartoon style.",
].join(" ");

/** Concrete drawable objects per topic — abstractions render as mush. */
const SUBJECTS: Record<string, string> = {
  "reasoning-methods": "a branching tree of proof paths where dead branches fade and one path stays solid, an hourglass metering deliberation, a folded chain of linked geometric plates, a stepped ladder of nested polygons, a dial gauge, and a magnifier over a fork in the path",
  "rl-for-reasoning": "a closed feedback loop of gears driving a scoring dial, a target with arrows clustering tighter over successive rings, a ratchet mechanism, a bank of candidate paths being pruned by a gate, a weighted balance, and a spiral of ascending steps",
  "agent-training": "a self-winding clockwork mechanism building a copy of itself, nested practice arenas of concentric walls, a conveyor of tools being picked up, a looping track with checkpoints, a growing branching scaffold, and a gearbox",
  "agent-benchmarks": "a row of instrumented test chambers with measurement dials, a stopwatch, a checklist of ticked geometric boxes, a maze with a traced solution line, a plug board of connected sockets, and a graduated measuring column",
  "coding-agents": "an engraved mechanical loom weaving ordered ribbons, a bank of interlocking punch-card plates, a set of precision calipers over a bracket structure, a repair clamp mending a broken link, nested modular blocks, and a validation gate",
  "search-agents": "a mariner's compass rose, a spreading web of query paths across a grid, a sieve separating fragments, a stack of retrieved plates being collated, a spyglass, and a converging funnel of channels",
  "agent-skills": "a rack of interchangeable mechanical tool heads, a keyring of distinct geometric keys, a cabinet of labelled-blank drawers, a modular arm assembling from parts, a spool unwinding a learned track, and a socket wrench set",
  "long-context": "an immensely long folded paper concertina compressed into a compact block, a telescoping tube, a filing spindle of stacked leaves, an aperture narrowing a wide beam, a coiled spring, and a sliding window frame over a long ribbon",
  "diffusion-lms": "a field of scattered particles resolving into an ordered lattice, a set of parallel shutters opening simultaneously, a fine-grain sieve, a wave settling into a flat plane, a bank of synchronized pistons, and a crystallising form",
  "model-efficiency": "a large mechanism distilling into a compact one, a set of nested Russian-doll geometric shells, a pressure gauge, a lattice with most nodes removed, a heat-sink comb, and a funnel compressing a wide flow into a narrow pipe",
  "model-architecture": "an exploded axonometric diagram of stacked structural layers, an armature of trusses and struts, a cutaway of interlocking rings, a blueprint of a modular frame, a bank of parallel channels, and a keystone arch",
  "data-curation": "a set of graded sorting sieves, a mill grinding raw matter into uniform grain, a fountain generating identical crystalline forms, a filtering funnel with sediment, stacked sorted trays, and a balance comparing two heaps",
  "interpretability-analysis": "a transparent cutaway of a mechanism with internal gears exposed, a magnifier over fine circuitry, a prism splitting a beam into separated bands, probe needles inserted into layered planes, a plotted curve on a grid, and an anatomical cross-section of a lattice",
  "vlm-architectures": "a lens assembly feeding into a layered lattice block, twin parallel channels merging into one trunk, an engraved eye-like aperture diagram, a grid of image tiles converging, a prism, and a junction box of joined conduits",
  "image-generation": "a printing press plate transferring an image, a fan of colour separation screens, an easel with a geometric composition resolving, a halftone screen, a stencil set, and a lens focusing a beam onto a plate",
  "video-generation": "a film strip curving through the frame, a zoetrope drum, a sequence of cascading frames with motion arcs, a clockwork escapement driving a reel, a lens turret, and a spiral of unfolding scenes",
  "video-understanding": "a film strip being read by a scanning head, a timeline bar with marked segments, a series of frames connected by tracking arcs, a stopwatch, a grid overlay tracing a moving form, and a magnifier over a frame",
  "spatial-3d": "a wireframe polyhedron with construction lines, a surveyor's theodolite, a contoured relief map, a point-cloud sphere resolving into a surface, an orthographic three-view projection, and nested coordinate axes",
  "document-ocr": "a scanning bar sweeping a beam across a smooth blank sheet, a grid of empty segmented rectangles forming a layout mesh, an empty wireframe grid of cells, a magnifier over a plain unmarked surface, a folded blank concertina, and a sorting tray of plain leaves",
  "audio-speech": "an engraved phonograph horn, a waveform ribbon oscillating across the frame, a bank of tuning forks of graded sizes, a spectral comb of vertical bars, a microphone diaphragm cutaway, and concentric propagating rings",
  "robot-policies": "an articulated mechanical arm gripping a geometric block, a jointed linkage diagram with motion arcs, a gripper mechanism cutaway, a stepped path across uneven terrain, a gyroscope, and a control linkage of rods",
  "science-medicine": "a brass microscope, a coiled protein ribbon, a molecular ball-and-stick lattice, a rack of laboratory flasks, a crystalline specimen under a loupe, and a stack of sectional scan plates",
  "research-automation": "a mechanical armature tracing a smooth curve on an unmarked surface, a web of linked spherical nodes, a geared collating conveyor, a plain screw press, a set of review calipers, and a rack of smooth featureless cylinders",
  "safety-alignment": "an engraved shield deflecting stray arrows, a heavy locked gate, balanced calibration scales, a tangled knot of cord combed into clean parallel strands, a containment cage around a form, and a valve regulating flow",
};

const args = process.argv.slice(2);
const only = args.find((argument) => argument.startsWith("--only="))?.slice(7);
const outputDirectory = path.join(process.cwd(), "output", "topic-art");

export async function generateTopicArt(slug: string, subject: string, apiKey: string) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt: `Subject: ${subject}. ${STYLE}`,
      width: WIDTH,
      height: HEIGHT,
      steps: STEPS,
      n: 1,
    }),
  });
  if (!response.ok) throw new Error(`${slug}: ${response.status} ${(await response.text()).slice(0, 160)}`);
  const payload = await response.json() as { data: Array<{ url: string }> };
  const image = Buffer.from(await (await fetch(payload.data[0]!.url)).arrayBuffer());

  const jpegPath = path.join(outputDirectory, `${slug}.jpg`);
  const pngPath = path.join(outputDirectory, `${slug}.png`);
  await writeFile(jpegPath, image);
  await run("sips", ["-s", "format", "png", jpegPath, "--out", pngPath]);
  await rm(jpegPath, { force: true });
  return pngPath;
}

if (process.argv[1]?.endsWith("generate-topic-art.ts")) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) throw new Error("Missing TOGETHER_API_KEY");
  await mkdir(outputDirectory, { recursive: true });

  const slugs = TOPIC_TAXONOMY.map((topic) => topic.slug).filter((slug) => !only || slug === only);
  for (const slug of slugs) {
    const subject = SUBJECTS[slug];
    if (!subject) {
      process.stdout.write(`skip ${slug} (no subject defined)\n`);
      continue;
    }
    try {
      const file = await generateTopicArt(slug, subject, apiKey);
      process.stdout.write(`ok   ${slug} -> ${path.relative(process.cwd(), file)}\n`);
    } catch (error) {
      process.stdout.write(`FAIL ${slug}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }
}
