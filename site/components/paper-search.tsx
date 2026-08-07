"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SEARCH_INDEX_URL } from "../lib/public-storage";
import { SearchIcon } from "./icons";

type SearchPaper = {
  id: string;
  title: string;
  authors: string[];
  lab: string | null;
  topics: string[];
  publishedAt: string;
};

type SearchData = { papers: SearchPaper[] };

export function PaperSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<SearchPaper[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || papers.length > 0) return;
    let active = true;
    setLoadFailed(false);
    fetch(SEARCH_INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Search index returned ${response.status}`);
        return response.json() as Promise<SearchData>;
      })
      .then((data) => {
        if (active) setPapers(data.papers);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, [open, papers.length]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setQuery("");
    setActiveIndex(0);
    window.requestAnimationFrame(() => inputRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];
    return papers
      .filter((paper) => {
        const searchable = [paper.title, paper.lab ?? "", ...paper.authors, ...paper.topics]
          .join(" ")
          .toLowerCase();
        return searchable.includes(normalized);
      })
      .slice(0, 7);
  }, [papers, query]);

  useEffect(() => setActiveIndex(0), [query]);

  if (!open) return null;

  function openResult(paper: SearchPaper) {
    router.push(`/papers/${paper.id}`);
    onClose();
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const paper = results[activeIndex];
      if (paper) openResult(paper);
    }
  }

  return (
    <div
      className="search-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="search-command paper-shadow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-command-title"
      >
        <header className="search-command-header">
          <h2 id="search-command-title" className="mono-label"><span>⌘K</span> Search the year in AI</h2>
          <button type="button" className="search-command-close focus-ring" onClick={onClose} aria-label="Close search">
            <span>Esc</span>
          </button>
        </header>
        <div className="search-command-input">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search papers, authors, labs, or ideas"
            aria-label="Search papers"
            role="combobox"
            aria-controls="search-command-results"
            aria-expanded={results.length > 0}
            aria-activedescendant={results[activeIndex] ? `search-result-${results[activeIndex]!.id}` : undefined}
            autoComplete="off"
          />
        </div>

        <div id="search-command-results" className="search-command-results" role="listbox">
          {query.trim().length < 2 ? (
            <div className="search-command-empty">
              <span className="mono-label">Search the collection</span>
              <p>Type at least two characters to explore {papers.length ? papers.length.toLocaleString("en") : "the full collection of"} papers.</p>
            </div>
          ) : loadFailed ? (
            <div className="search-command-empty">Search is unavailable right now. Please try again.</div>
          ) : results.length > 0 ? (
            results.map((paper, index) => (
              <Link
                id={`search-result-${paper.id}`}
                key={paper.id}
                href={`/papers/${paper.id}`}
                className={`${index === activeIndex ? "active " : ""}search-command-result focus-ring`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={onClose}
              >
                <span className="search-command-index mono-label">{String(index + 1).padStart(2, "0")}</span>
                <span className="mono-label">{paper.lab ?? "Research paper"}</span>
                <strong>{paper.title}</strong>
                <small>{paper.authors.slice(0, 3).join(", ")}</small>
                <i>↵</i>
              </Link>
            ))
          ) : (
            <div className="search-command-empty">No papers found. Try another title, author, lab, or idea.</div>
          )}
        </div>

        <footer className="search-command-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>↵</kbd> Open</span>
          <span><kbd>Esc</kbd> Close</span>
        </footer>
      </div>
    </div>
  );
}
