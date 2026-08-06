import Link from "next/link";
import { ArrowIcon, BookmarkIcon } from "./icons";

export function SiteHeader() {
  return (
    <header className="site-header page-shell">
      <Link href="/" className="brand focus-ring" aria-label="Together AI research home">
        <img src="/brands/together-ai.svg" alt="Together AI" />
        <i />
        <small>Research</small>
      </Link>
      <nav aria-label="Primary navigation">
        <Link className="active focus-ring" href="/">
          The year
        </Link>
        <Link className="focus-ring" href="/#collections">
          Collections
        </Link>
        <Link className="focus-ring" href="/#about">
          About
        </Link>
        <Link className="focus-ring" href="/#methodology">
          Methodology
        </Link>
        <Link className="focus-ring" href="/#notes">
          Lab notes
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
