"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowIcon, SearchIcon } from "./icons";
import { PaperSearch } from "./paper-search";

const navigationItems = [
  { href: "/", label: "The year", active: (pathname: string) => pathname === "/" },
  { href: "/most-trending-papers", label: "Most trending", active: (pathname: string) => pathname === "/most-trending-papers" },
  { href: "/most-cited-papers", label: "Most cited", active: (pathname: string) => pathname === "/most-cited-papers" },
  { href: "/most-starred-papers", label: "Most starred", active: (pathname: string) => pathname === "/most-starred-papers" },
  { href: "/topics", label: "Topics", active: (pathname: string) => pathname.startsWith("/topics") },
  { href: "/#about", label: "How we built it", active: () => false },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsMobileMenuOpen(false);
        setIsSearchOpen(true);
      }
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => setIsMobileMenuOpen(false), [pathname]);

  function closeSearch() {
    setIsSearchOpen(false);
    window.requestAnimationFrame(() => searchButtonRef.current?.focus());
  }

  return (
    <header className="site-header page-shell">
      <Link href="/" className="brand focus-ring" aria-label="Together AI research home">
        <img src="/brands/together-ai.svg" alt="Together AI" />
        <i />
        <small>Research</small>
      </Link>
      <nav className="desktop-nav" aria-label="Primary navigation">
        <NavigationLinks pathname={pathname} />
      </nav>
      <div className="header-actions">
        <button
          ref={searchButtonRef}
          type="button"
          className="header-search-button focus-ring"
          aria-label="Search papers"
          aria-haspopup="dialog"
          aria-expanded={isSearchOpen}
          aria-keyshortcuts="Meta+K Control+K"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsSearchOpen(true);
          }}
        >
          <SearchIcon />
          <kbd>⌘K</kbd>
        </button>
        <a className="about-link focus-ring" href="https://www.together.ai" target="_blank" rel="noreferrer">
          About Together AI <ArrowIcon />
        </a>
        <button
          type="button"
          className="mobile-menu-button focus-ring"
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-controls="mobile-navigation"
          aria-expanded={isMobileMenuOpen}
          onClick={() => {
            setIsSearchOpen(false);
            setIsMobileMenuOpen((open) => !open);
          }}
        >
          <span className={`mobile-menu-icon${isMobileMenuOpen ? " open" : ""}`} aria-hidden="true"><i /><i /></span>
          <span>Menu</span>
        </button>
      </div>
      <nav id="mobile-navigation" className={`mobile-nav${isMobileMenuOpen ? " open" : ""}`} aria-label="Mobile navigation">
        <NavigationLinks pathname={pathname} onNavigate={() => setIsMobileMenuOpen(false)} />
      </nav>
      <PaperSearch open={isSearchOpen} onClose={closeSearch} />
    </header>
  );
}

function NavigationLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return navigationItems.map((item) => (
    <Link
      key={item.href}
      className={`${item.active(pathname) ? "active " : ""}focus-ring`}
      href={item.href}
      onClick={onNavigate}
    >
      {item.label}
    </Link>
  ));
}
