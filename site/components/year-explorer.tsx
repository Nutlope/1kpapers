import Link from "next/link";

export type MonthEntry = {
  key: string;
  month: string;
  year: string;
  count: number;
};

export function YearExplorer({
  months,
  selectedMonth = null,
  openInNewTab = true,
  totalCount,
  totalLabel,
}: {
  months: MonthEntry[];
  selectedMonth?: string | null;
  openInNewTab?: boolean;
  totalCount?: number;
  totalLabel?: string;
}) {
  const displayedTotal = totalCount ?? months.reduce((total, month) => total + month.count, 0);

  return (
    <section className="year-explorer page-shell rule-top" aria-labelledby="year-title">
      <div className="year-heading">
        <h2 id="year-title" className="mono-label">Explore the year</h2>
        <Link href="/timeline" className="signal-link section-action focus-ring">View all months →</Link>
      </div>
      <div className="month-track">
        {months.map((month) => (
          <Link
            key={month.key}
            href={`/months/${month.key}`}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noreferrer" : undefined}
            className={`${selectedMonth === month.key ? "current " : ""}focus-ring`}
            aria-current={selectedMonth === month.key ? "page" : undefined}
            title={`Open ${month.count} papers from ${month.month} ${month.year}${openInNewTab ? " in a new tab" : ""}`}
          >
            <span>{month.month}</span>
            <small>{month.year}</small>
            <span className="sr-only">, {selectedMonth === month.key ? "current month, " : ""}{month.count} papers{openInNewTab ? ", opens in a new tab" : ""}</span>
            <i />
          </Link>
        ))}
      </div>
      <div className="curated-count">
        <strong className="display-serif tabular-nums">{totalLabel ?? displayedTotal.toLocaleString("en")}</strong>
        <span>papers<br /><small>curated and indexed</small></span>
      </div>
    </section>
  );
}
