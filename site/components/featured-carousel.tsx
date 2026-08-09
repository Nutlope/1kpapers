"use client";

import { useEffect, useRef, useState } from "react";
import type { PaperCardData } from "../lib/paper-shared";
import { PaperCard } from "./paper-card";

const accents = ["magenta", "yellow", "cyan"] as const;
const AUTOPLAY_INTERVAL_MS = 6_000;
const VISIBLE_PAPERS = 3;

export function FeaturedCarousel({ papers }: { papers: PaperCardData[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeIndexRef = useRef(0);
  const positionCount = Math.max(1, papers.length - VISIBLE_PAPERS + 1);

  const isPaused = isHovered || isFocusWithin || prefersReducedMotion;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (isPaused || positionCount <= 1) return;
    const timeout = window.setTimeout(() => {
      scrollToPosition((activeIndexRef.current + 1) % positionCount);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, isPaused, positionCount]);

  useEffect(() => () => {
    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
  }, []);

  function scrollToPosition(index: number) {
    const rail = railRef.current;
    if (!rail) return;
    const position = Math.min(Math.max(index, 0), positionCount - 1);
    const paper = rail.children.item(position);
    if (!(paper instanceof HTMLElement)) return;

    activeIndexRef.current = position;
    setActiveIndex(position);
    rail.scrollTo({
      left: paper.offsetLeft - rail.offsetLeft,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function move(direction: -1 | 1) {
    if (positionCount <= 1) return;
    scrollToPosition((activeIndexRef.current + direction + positionCount) % positionCount);
  }

  function updateActivePaper() {
    const rail = railRef.current;
    if (!rail) return;

    if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      const children = Array.from(rail.children)
        .filter((child): child is HTMLElement => child instanceof HTMLElement)
        .slice(0, positionCount);
      const closest = children.reduce((best, child, index) => {
        const distance = Math.abs((child.offsetLeft - rail.offsetLeft) - rail.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      }, { index: 0, distance: Number.POSITIVE_INFINITY });
      activeIndexRef.current = closest.index;
      setActiveIndex(closest.index);
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }
  }

  return (
    <div
      className="featured-carousel"
      aria-roledescription="carousel"
      aria-label="Trending papers"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocusWithin(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocusWithin(false);
      }}
    >
      <div
        className="featured-cards"
        ref={railRef}
        tabIndex={0}
        onScroll={updateActivePaper}
        onKeyDown={handleKeyDown}
      >
        {papers.map((paper, index) => (
          <PaperCard key={paper.id} paper={paper} accent={accents[index % accents.length] ?? "magenta"} eager={index === 0} />
        ))}
      </div>
      <div className="carousel-nav">
        <button type="button" className="carousel-arrow focus-ring" onClick={() => move(-1)} disabled={positionCount <= 1} aria-label="Previous trending papers">←</button>
        <div className="carousel-position">
          <span className="mono-label tabular-nums" aria-live={isPaused ? "polite" : "off"}>{String(activeIndex + 1).padStart(2, "0")} / {String(positionCount).padStart(2, "0")}</span>
          <div className="carousel-ticks" aria-label="Choose a carousel position">
            {papers.slice(0, positionCount).map((paper, index) => (
              <button
                key={paper.id}
                type="button"
                className={`${activeIndex === index ? "active " : ""}focus-ring`}
                onClick={() => scrollToPosition(index)}
                aria-label={`Go to position ${index + 1}, starting with ${paper.title}`}
                aria-current={activeIndex === index ? "true" : undefined}
              />
            ))}
          </div>
        </div>
        <button type="button" className="carousel-arrow carousel-arrow-next focus-ring" onClick={() => move(1)} disabled={positionCount <= 1} aria-label="Next trending papers">
          {!isPaused && positionCount > 1 ? (
            <svg
              key={activeIndex}
              className="carousel-countdown"
              viewBox="0 0 40 40"
              aria-hidden="true"
              style={{ animationDuration: `${AUTOPLAY_INTERVAL_MS}ms` }}
            >
              <circle cx="20" cy="20" r="18.75" pathLength="1" />
            </svg>
          ) : null}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
