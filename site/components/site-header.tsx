"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowIcon, BookmarkIcon } from "./icons";

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header page-shell">
      <Link href="/" className="brand focus-ring" aria-label="Together AI research home">
        <img src="/brands/together-ai.svg" alt="Together AI" />
        <i />
        <small>Research</small>
      </Link>
      <nav aria-label="Primary navigation">
        <Link className={`${pathname === "/" ? "active " : ""}focus-ring`} href="/">
          The year
        </Link>
        <Link className={`${pathname === "/most-trending-papers" ? "active " : ""}focus-ring`} href="/most-trending-papers">
          Most trending
        </Link>
        <Link className={`${pathname === "/most-cited-papers" ? "active " : ""}focus-ring`} href="/most-cited-papers">
          Most cited
        </Link>
        <Link className={`${pathname.startsWith("/topics") ? "active " : ""}focus-ring`} href="/topics">
          Topics
        </Link>
        <Link className="focus-ring" href="/#about">
          About
        </Link>
        <Link className="focus-ring" href="/#methodology">
          Methodology
        </Link>
      </nav>
      <div className="header-actions">
        <a className="about-link focus-ring" href="https://www.together.ai" target="_blank" rel="noreferrer">
          About Together AI <ArrowIcon />
        </a>
        <button className="bookmark-button focus-ring" aria-label="Saved papers">
          <BookmarkIcon />
        </button>
      </div>
    </header>
  );
}
