import Link from "next/link";
import type { Paper } from "../lib/papers";
import { formatMonthYear } from "../lib/papers";

export function PaperCard({ paper, accent = "magenta" }: { paper: Paper; accent?: "magenta" | "yellow" | "cyan" }) {
  return (
    <Link href={`/papers/${paper.id}`} className={`paper-card paper-shadow focus-ring accent-${accent}`}>
      <span className="corner-fold" />
      <span className="mono-label">{paper.lab ?? paper.venue ?? "Research"}</span>
      <h3 className="display-serif text-balance">{paper.title}</h3>
      <time dateTime={paper.publishedAt}>{formatMonthYear(paper.publishedAt)}</time>
    </Link>
  );
}
