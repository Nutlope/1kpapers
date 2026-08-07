"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatMonthYear, type PaperListing } from "../lib/papers";
import { ArrowIcon } from "./icons";

const previousPickKey = "year-in-ai-previous-personal-pick";

export function PersonalPaperPick({ papers }: { papers: PaperListing[] }) {
  const [paper, setPaper] = useState<PaperListing | null>(null);
  const hasPicked = useRef(false);

  useEffect(() => {
    if (hasPicked.current || papers.length === 0) return;
    hasPicked.current = true;

    const uniquePapers = [...new Map(papers.map((candidate) => [candidate.id, candidate])).values()];
    let previousId: string | null = null;
    try {
      previousId = window.sessionStorage.getItem(previousPickKey);
    } catch {
      // The recommendation still works when browser storage is unavailable.
    }

    const available = uniquePapers.length > 1
      ? uniquePapers.filter((candidate) => candidate.id !== previousId)
      : uniquePapers;
    const selected = available[Math.floor(Math.random() * available.length)] ?? uniquePapers[0] ?? null;

    if (selected) {
      try {
        window.sessionStorage.setItem(previousPickKey, selected.id);
      } catch {
        // Ignore storage failures; the selected paper can still be displayed.
      }
    }
    setPaper(selected);
  }, [papers]);

  return (
    <section className="personal-pick page-shell" aria-label="A paper picked for you" aria-live="polite">
      {paper ? (
        <Link className="personal-pick-card focus-ring" href={`/papers/${paper.id}`}>
          <div className="personal-pick-kicker">
            <span aria-hidden="true">✦</span>
            <p className="mono-label">This paper was picked just for you</p>
          </div>
          <div className="personal-pick-copy">
            <p className="mono-label">
              {paper.lab ?? paper.venue ?? "Independent research"} / {formatMonthYear(paper.publishedAt)}
            </p>
            <h2 className="display-serif text-balance">{paper.title}</h2>
            <p className="text-pretty">{paper.summary}</p>
          </div>
          <span className="personal-pick-action">Read the paper <ArrowIcon /></span>
        </Link>
      ) : (
        <div className="personal-pick-card personal-pick-loading" aria-busy="true">
          <span className="mono-label">Picking a paper for you…</span>
        </div>
      )}
    </section>
  );
}
