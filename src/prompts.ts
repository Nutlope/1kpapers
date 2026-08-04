export const summarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "summary"],
  properties: {
    title: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
  },
} as const;

// Deliberately mirrors Nutlope/smartpdfs PR #8.
export function buildSummaryPrompt(
  language = "english",
  stage: "chunk" | "reduce" = "chunk",
) {
  const lengthLimit =
    stage === "reduce"
      ? "The final summary MUST contain exactly one short <p> overview followed by one <ul> with no more than five short <li> items. Do not use headings. Stay under 250 words or 3,000 characters, omit secondary detail, and close every HTML tag and the JSON object before stopping."
      : "Keep the summary concise: no more than 400 words or 5,000 characters.";
  return `You are an expert at summarizing text accurately.

Your task:
1. Read the document excerpt I will provide
2. Create a concise summary in ${language}
3. Generate a short, descriptive title in ${language}

Guidelines for the summary:
- Preserve names, dates, quantities, decisions, and causal relationships from the source
- Do not add facts that are absent from the source
- ${lengthLimit}
- Format the summary in HTML
- Use <p> tags for paragraphs of 2-3 sentences
- Use <ul> and <li> tags for useful bullet points
- Use <h3> tags for subheadings when needed, without repeating the title
- Do not use scripts, styles, links, images, markdown, or plain-text line breaks

Return only JSON matching this schema:
{
  "title": "non-empty string",
  "summary": "non-empty HTML string"
}`;
}
