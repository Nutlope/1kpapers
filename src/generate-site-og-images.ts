import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

const ENDPOINT = "https://api.together.xyz/v1/images/generations";
const MODEL = "black-forest-labs/FLUX.2-flex";
const WIDTH = 1_792;
const HEIGHT = 1_008;
const STEPS = 32;
const SITE_TITLE = "The Year in AI Papers";

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "output", "site-og");
const publicDirectory = path.join(projectRoot, "site", "public", "generated", "site-og");
const appDirectory = path.join(projectRoot, "site", "app");
const togetherLogoPath = path.join(projectRoot, "site", "public", "brands", "together-ai.svg");

const commonStyle = [
  "Create a wide editorial key illustration for a social sharing cover on pure bright white paper.",
  "The visual language is a vintage scientific encyclopedia plate crossed with a 1970s research journal and a cobalt risograph print.",
  "Use fine technical contour drawing, dense cobalt cross-hatching, stippling, coarse halftone, broken toner, dot gain, and slight print misregistration.",
  "Use tiny Together-inspired magenta, orange, cyan, and green registration accents sparingly, never as large color fields.",
  "Composition: keep the entire left 46 percent completely empty pure white paper for a later logo and title overlay. Place one coherent, monumental illustration in the right 54 percent, with generous white space around it and no hard vertical boundary.",
  "The artwork must remain clear at thumbnail size. Pure white background, no cream or gray wash, no gradients, no border, no panels, no interface.",
  "Absolutely no typography or text-like marks: no title, words, letters, numbers, equations, labels, captions, logos, watermarks, writing, glyphs, or ruled text lines.",
  "Every sheet, page, card, book, plate, dial, and panel is blank and unmarked.",
  "Avoid brains, human heads, people, humanoid robots, glossy 3D, polished digital painting, stock illustration, cartoons, fantasy posters, cyberpunk neon, and clutter.",
].join(" ");

const variations = [
  {
    id: "01-research-atlas",
    label: "Research atlas",
    concept: "An exploded research atlas built from layered blank paper folios, an unlabeled non-directional locator made only from concentric rings, a magnifying lens, nested topographic contours, and slender paths connecting abstract paper landmarks into one navigable field guide. No compass points, cardinal directions, or arrow letters. The composition suggests discovering and organizing a year of AI research.",
  },
  {
    id: "02-year-orbit",
    label: "Year in orbit",
    concept: "Thirteen blank archival paper leaves orbit a central optical instrument like a scientific orrery. Each leaf has a distinct geometric silhouette and connects through delicate arcs into one annual cycle. A single open blank folio anchors the system, suggesting a year of papers becoming a coherent atlas.",
  },
  {
    id: "03-reading-engine",
    label: "Reading engine",
    concept: "A monumental mechanical reading engine processes a tall cascade of completely blank paper sheets through lenses, calipers, sorting gates, and a compact printing press, then releases a small ordered set of smooth blank paper blocks without covers or spines. No books, tabs, labels, marks, or numbered surfaces. The machinery feels rigorous and editorial, not industrial or futuristic.",
  },
  {
    id: "04-paper-constellation",
    label: "Paper constellation",
    concept: "A constellation made only from smooth blank folded folios, geometric apertures, lenses, and simple solid archival instruments. Fine dotted paths connect the unmarked paper forms into clusters around one open central blank volume. No charts, photographs, diagrams, article layouts, printed pages, dials, rulers, or writing surfaces.",
  },
  {
    id: "05-field-guide-cabinet",
    label: "Field guide cabinet",
    concept: "An elegant exploded specimen cabinet for AI research: smooth blank folios, plain folded paper forms, lenses, geometric solids, and tiny mechanical instruments arranged in open unlabeled archival drawers around one central blank field-guide volume. Every surface is featureless. No diagrams, index tabs, cards, dividers, labels, book spines, handwriting, printed marks, or writing surfaces.",
  },
] as const;

const args = parseArgs(process.argv.slice(2));
const selectedVariations = variations.filter((variation) => !args.only || variation.id === args.only);
if (selectedVariations.length === 0) throw new Error(`Unknown variation: ${args.only}`);

await mkdir(outputDirectory, { recursive: true });
await mkdir(publicDirectory, { recursive: true });

const apiKey = process.env.TOGETHER_API_KEY;
if (!args.composeOnly && !apiKey) throw new Error("Missing TOGETHER_API_KEY");

const logoSvg = await readFile(togetherLogoPath, "utf8");
const logoBody = logoSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
if (!logoBody) throw new Error("Could not read Together AI logo SVG");
const overlayPath = path.join(outputDirectory, "site-brand-overlay.png");
await renderBrandOverlay(logoBody, overlayPath);

const manifest: Array<{ id: string; label: string; model: string; prompt: string; file: string }> = [];

for (const variation of selectedVariations) {
  const prompt = `Subject: ${variation.concept} ${commonStyle}`;
  const backgroundPath = path.join(outputDirectory, `${variation.id}-background.jpg`);
  const outputPath = path.join(publicDirectory, `${variation.id}.png`);

  if (!args.composeOnly) {
    process.stdout.write(`generate ${variation.id} with ${MODEL}\n`);
    await generateBackground(prompt, backgroundPath, apiKey!);
  }

  await composeCover(backgroundPath, outputPath, overlayPath);
  manifest.push({
    id: variation.id,
    label: variation.label,
    model: MODEL,
    prompt,
    file: path.relative(projectRoot, outputPath),
  });
  process.stdout.write(`ok       ${path.relative(projectRoot, outputPath)}\n`);
}

await writeFile(
  path.join(outputDirectory, "manifest.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), width: 1_200, height: 630, variations: manifest }, null, 2)}\n`,
);

if (args.select) {
  const selected = variations.find((variation) => variation.id === args.select);
  if (!selected) throw new Error(`Unknown selected variation: ${args.select}`);
  const selectedPath = path.join(publicDirectory, `${selected.id}.png`);
  await copyFile(selectedPath, path.join(appDirectory, "opengraph-image.png"));
  await copyFile(selectedPath, path.join(appDirectory, "twitter-image.png"));
  process.stdout.write(`selected ${selected.id} as the site default\n`);
}

async function generateBackground(prompt: string, outputPath: string, key: string) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, width: WIDTH, height: HEIGHT, steps: STEPS, n: 1 }),
  });
  if (!response.ok) throw new Error(`${response.status} ${(await response.text()).slice(0, 240)}`);

  const payload = await response.json() as { data?: Array<{ url?: string; b64_json?: string }> };
  const result = payload.data?.[0];
  if (!result) throw new Error("Together returned no image");

  const bytes = result.b64_json
    ? Buffer.from(result.b64_json, "base64")
    : result.url
      ? Buffer.from(await (await fetch(result.url)).arrayBuffer())
      : null;
  if (!bytes) throw new Error("Together returned neither an image URL nor base64 data");
  await writeFile(outputPath, bytes);
}

async function renderBrandOverlay(logo: string, outputPath: string) {
  const svgPath = path.join(outputDirectory, "site-brand-overlay.svg");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="whiteFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fffefb" stop-opacity="1"/>
      <stop offset="0.72" stop-color="#fffefb" stop-opacity="1"/>
      <stop offset="1" stop-color="#fffefb" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="680" height="630" fill="url(#whiteFade)"/>
  <svg x="60" y="55" width="166" height="35" viewBox="0 0 1146.52 241.42" aria-label="Together AI">
    ${logo}
  </svg>
  <line x1="60" y1="116" x2="500" y2="116" stroke="#d9d8d3" stroke-width="1"/>
  <text x="60" y="207" fill="#121212" font-family="Iowan Old Style, Baskerville, Times New Roman, serif" font-size="76" letter-spacing="-2">The Year</text>
  <text x="60" y="287" fill="#121212" font-family="Iowan Old Style, Baskerville, Times New Roman, serif" font-size="76" letter-spacing="-2">in AI Papers</text>
  <text x="63" y="378" fill="#56544f" font-family="Arial, Helvetica, sans-serif" font-size="26">Discover 1,000+ AI papers,</text>
  <text x="63" y="413" fill="#56544f" font-family="Arial, Helvetica, sans-serif" font-size="26">summarized and organized into</text>
  <text x="63" y="448" fill="#56544f" font-family="Arial, Helvetica, sans-serif" font-size="26">a navigable research atlas.</text>
  <line x1="60" y1="548" x2="500" y2="548" stroke="#121212" stroke-width="1"/>
</svg>`;

  await writeFile(svgPath, svg);
  await run("sips", ["-s", "format", "png", svgPath, "--out", outputPath]);
}

async function composeCover(backgroundPath: string, outputPath: string, overlayPath: string) {
  await run("ffmpeg", [
    "-hide_banner",
    "-loglevel", "error",
    "-y",
    "-i", backgroundPath,
    "-i", overlayPath,
    "-filter_complex", "[0:v]scale=1200:675,crop=1200:630:0:22[background];[background][1:v]overlay=0:0",
    "-frames:v", "1",
    outputPath,
  ]);
}

function parseArgs(argv: string[]) {
  const values: Record<string, string> = {};
  for (const argument of argv) {
    const [flag, value] = argument.split("=", 2);
    if (!flag?.startsWith("--")) throw new Error(`Invalid argument: ${argument}`);
    values[flag.slice(2)] = value ?? "true";
  }
  return {
    composeOnly: values["compose-only"] === "true",
    only: values.only,
    select: values.select,
  };
}
