"use client";

import Link from "next/link";
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

export function PaperSearch() {
  const [query, setQuery] = useState("");
  const [papers, setPapers] = useState<SearchPaper[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    fetch(SEARCH_INDEX_URL)
      .then((response) => response.json() as Promise<SearchData>)
      .then((data) => {
        if (active) setPapers(data.papers);
      })
      .catch(() => {
        if (active) setPapers([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
        event.preventDefault();
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        inputRef.current?.blur();
        setIsFocused(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      .slice(0, 6);
  }, [papers, query]);

  return (
    <div className="paper-search">
      <SearchIcon className="search-icon" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => window.setTimeout(() => setIsFocused(false), 120)}
        placeholder="Find a paper, author, lab, or idea"
        aria-label="Search papers"
      />
      <kbd>/</kbd>
      {isFocused && query.length >= 2 ? (
        <div className="search-results paper-shadow">
          {results.length > 0 ? (
            results.map((paper) => (
              <Link key={paper.id} href={`/papers/${paper.id}`} className="search-result focus-ring">
                <span className="mono-label">{paper.lab ?? "Research paper"}</span>
                <strong>{paper.title}</strong>
                <small>{paper.authors.slice(0, 3).join(", ")}</small>
              </Link>
            ))
          ) : (
            <div className="search-empty">No papers found. Try another title, author, or lab.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
