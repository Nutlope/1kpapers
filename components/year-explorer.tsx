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
}: {
  months: MonthEntry[];
  selectedMonth?: string | null;
  openInNewTab?: boolean;
}) {
  const activeEntry = months.find((month) => month.key === selectedMonth);

  return (
    <section className="year-explorer page-shell rule-top" aria-labelledby="year-title">
      <div className="year-heading">
        <h2 id="year-title" className="mono-label">Explore the year</h2>
        <span>{activeEntry ? `${activeEntry.month} ${activeEntry.year} · ${activeEntry.count} papers` : "Open a month"}</span>
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
            aria-label={`${selectedMonth === month.key ? "Current month, " : "Open "}${month.month} ${month.year}, ${month.count} papers${openInNewTab ? ", in a new tab" : ""}`}
            title={`Open ${month.count} papers from ${month.month} ${month.year}${openInNewTab ? " in a new tab" : ""}`}
          >
            <span>{month.month}</span>
            <small>{month.year}</small>
            <i />
          </Link>
        ))}
      </div>
      <div className="curated-count">
        <strong className="display-serif tabular-nums">1,000</strong>
        <span>papers<br /><small>curated and indexed</small></span>
      </div>
    </section>
  );
}
