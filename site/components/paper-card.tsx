import Image from "next/image";
import Link from "next/link";
import { labDisplayName } from "../lib/labs";
import { formatMonthYear, type PaperCardData } from "../lib/paper-shared";
import { getPaperArtwork } from "../lib/paper-artwork";
import { paperHref } from "../lib/paper-url";

export function PaperCard({ paper, accent = "magenta", eager = false }: { paper: PaperCardData; accent?: "magenta" | "yellow" | "cyan"; eager?: boolean }) {
  const artwork = getPaperArtwork(paper.id);

  if (artwork) {
    return (
      <Link href={paperHref(paper)} className="paper-card paper-card-with-art paper-shadow focus-ring">
        <Image
          className="paper-card-art"
          src={artwork.cover}
          alt={`Editorial cover for ${paper.title}`}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 960px) calc((100vw - 44px) / 3), 220px"
        />
      </Link>
    );
  }

  return (
    <Link href={paperHref(paper)} className={`paper-card paper-shadow focus-ring accent-${accent}`}>
      <span className="corner-fold" />
      <span className="mono-label">{labDisplayName(paper.lab) ?? paper.venue ?? "Research"}</span>
      <h3 className="display-serif text-balance">{paper.title}</h3>
      <time dateTime={paper.publishedAt}>{formatMonthYear(paper.publishedAt)}</time>
    </Link>
  );
}
