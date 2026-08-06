export function summarySchema(stage: "chunk" | "reduce") {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "summary"],
    properties: {
      title: { type: "string", minLength: 1, maxLength: 300 },
      summary: {
        type: "string",
        minLength: 1,
        maxLength: stage === "reduce" ? 3_000 : 5_000,
      },
    },
  } as const;
}

// Deliberately mirrors Nutlope/smartpdfs PR #8.
export function buildSummaryPrompt(
  language = "english",
  stage: "chunk" | "reduce" = "chunk",
) {
  const formatRules =
    stage === "reduce"
      ? `- The summary MUST contain exactly one short overview paragraph followed by a blank line and one to five Markdown bullet lines beginning with "- "
- Do not use headings, HTML, nested lists, tables, links, code fences, or text after the bullet list
- Aim for 150 to 200 words and never exceed 250 words or 3,000 characters; omit secondary detail and close the JSON object before stopping`
      : `- Keep the summary under 400 words and 5,000 characters
- Format the summary as plain Markdown paragraphs and bullet lists
- Do not use HTML, links, images, tables, or code fences`;
  return `You are an expert at summarizing text accurately.

Your task:
1. Read the document excerpt I will provide
2. Create a concise summary in ${language}
3. Generate a short, descriptive title in ${language}

Guidelines for the summary:
- Preserve names, dates, quantities, decisions, and causal relationships from the source
- Do not add facts that are absent from the source
${formatRules}

Return only JSON matching this schema:
{
  "title": "non-empty string",
  "summary": "non-empty Markdown string"
}`;
}

export function isValidFinalSummaryMarkdown(value: string) {
  const normalized = normalizeFinalSummaryMarkdown(value);
  return normalized !== null && !normalized.truncated;
}

export function normalizeSummaryForStage(
  value: string,
  stage: "chunk" | "reduce",
) {
  if (stage === "chunk") return normalizeChunkSummaryMarkdown(value);
  const result = normalizeFinalSummaryMarkdown(value);
  return result
    ? { summary: result.markdown, normalized: result.truncated }
    : null;
}

function normalizeChunkSummaryMarkdown(value: string) {
  if (!value?.trim()) return null;
  const original = value.trim();
  const words = [...original.matchAll(/\S+/g)];
  let summary = original;
  let truncated = false;
  if (words.length > 400) {
    const last = words[399]!;
    summary = `${original
      .slice(0, last.index! + last[0].length)
      .replace(/[.,;:!?…]+$/, "")}…`;
    truncated = true;
  }
  if (summary.length > 5_000) {
    const candidate = summary.slice(0, 4_999).replace(/\s+\S*$/, "").trimEnd();
    summary = `${candidate || summary.slice(0, 4_999)}…`;
    truncated = true;
  }
  return { summary, normalized: truncated };
}

export function normalizeFinalSummaryMarkdown(value: string, maxWords = 250) {
  if (!value?.trim() || /<!--|<!doctype|```/i.test(value))
    return null;
  const safe = value
    // Research summaries often name literal control tokens such as <think> or
    // <Path>. Escape tag-shaped text so it remains visible without rendering
    // as HTML in the generated Markdown report.
    .replace(/<\/?[a-z][^>]*>/gi, (tag) =>
      tag.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    )
    .replaceAll("\r\n", "\n")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^#{1,6}\s+/, "")
        .replace(/^[*+]\s+/, "- ")
        .replace(/(\*\*|__|~~|`)/g, ""),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!safe) return null;

  const originalWordCount = countMarkdownWords(safe);
  let remainingWords = maxWords;
  const renderedLines: string[] = [];
  let truncated = false;
  for (const line of safe.split("\n")) {
    if (!line) {
      if (renderedLines.at(-1) !== "") renderedLines.push("");
      continue;
    }
    const bullet = line.match(/^(-\s+)(.*)$/);
    const prefix = bullet?.[1] ?? "";
    const content = bullet?.[2] ?? line;
    const words = content.trim().split(/\s+/).filter(Boolean);
    if (words.length <= remainingWords) {
      renderedLines.push(`${prefix}${words.join(" ")}`);
      remainingWords -= words.length;
      continue;
    }
    const kept = words.slice(0, Math.max(0, remainingWords));
    if (kept.length) {
      kept[kept.length - 1] = `${kept.at(-1)!.replace(/[.,;:!?…]+$/, "")}…`;
      renderedLines.push(`${prefix}${kept.join(" ")}`);
    }
    truncated = true;
    break;
  }
  let markdown = renderedLines.join("\n").replace(/\n+$/, "");
  if (markdown.length > 3_000) {
    const candidate = markdown.slice(0, 2_999).replace(/\s+\S*$/, "").trimEnd();
    markdown = `${candidate || markdown.slice(0, 2_999)}…`;
    truncated = true;
  }
  if (!markdown) return null;
  return {
    markdown,
    truncated,
    originalWordCount,
    finalWordCount: countMarkdownWords(markdown),
  };
}

function countMarkdownWords(value: string) {
  return value
    .replace(/^\s*-\s+/gm, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}
