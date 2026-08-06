"use client";

import { useMemo, useRef, useState } from "react";
import type { Paper } from "../lib/paper-shared";
import { PaperCard } from "./paper-card";

export function FeaturedCarousel({ papers }: { papers: Paper[] }) {
  const [page, setPage] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const pageCount = Math.max(1, Math.ceil(papers.length / 3));
  const visiblePapers = useMemo(() => {
    const start = page * 3;
    return papers.slice(start, start + 3);
  }, [page, papers]);

  function move(direction: -1 | 1) {
    setPage((current) => (current + direction + pageCount) % pageCount);
    railRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }

  return (
    <>
      <div className="featured-cards" ref={railRef} aria-live="polite">
        {visiblePapers.map((paper, index) => (
          <PaperCard key={paper.id} paper={paper} accent={(["magenta", "yellow", "cyan"] as const)[index] ?? "magenta"} />
        ))}
      </div>
      <div className="carousel-nav">
        <button type="button" className="focus-ring" onClick={() => move(-1)} aria-label="Previous featured papers">←</button>
        {Array.from({ length: pageCount }, (_, index) => (
          <i key={index} className={page === index ? "active" : ""} />
        ))}
        <button type="button" className="focus-ring" onClick={() => move(1)} aria-label="Next featured papers">→</button>
      </div>
    </>
  );
}
