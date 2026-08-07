export type ParsedPaperSummary = {
  paragraphs: string[];
  bullets: string[];
};

export function parsePaperSummaryMarkdown(summary: string): ParsedPaperSummary {
  const paragraphs: string[] = [];
  const bullets: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    const paragraph = paragraphLines.join(" ").trim();
    if (paragraph) {
      paragraphs.push(
        ...paragraph.split(/(?<=[.!?])\s+/).filter(Boolean),
      );
    }
    paragraphLines = [];
  };

  for (const rawLine of summary.replaceAll("\r\n", "\n").trim().split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const bullet = line.match(/^[-*+]\s+(.+)$/);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]!.trim());
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return { paragraphs, bullets };
}
