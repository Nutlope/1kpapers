export type MonthDefinition = {
  key: string;
  month: string;
  year: string;
  label: string;
};

export const monthDefinitions: MonthDefinition[] = [
  { key: "2025-08", month: "Aug", year: "2025", label: "August 2025" },
  { key: "2025-09", month: "Sep", year: "2025", label: "September 2025" },
  { key: "2025-10", month: "Oct", year: "2025", label: "October 2025" },
  { key: "2025-11", month: "Nov", year: "2025", label: "November 2025" },
  { key: "2025-12", month: "Dec", year: "2025", label: "December 2025" },
  { key: "2026-01", month: "Jan", year: "2026", label: "January 2026" },
  { key: "2026-02", month: "Feb", year: "2026", label: "February 2026" },
  { key: "2026-03", month: "Mar", year: "2026", label: "March 2026" },
  { key: "2026-04", month: "Apr", year: "2026", label: "April 2026" },
  { key: "2026-05", month: "May", year: "2026", label: "May 2026" },
  { key: "2026-06", month: "Jun", year: "2026", label: "June 2026" },
  { key: "2026-07", month: "Jul", year: "2026", label: "July 2026" },
  { key: "2026-08", month: "Aug", year: "2026", label: "August 2026" },
];

export function getMonthDefinition(key: string) {
  return monthDefinitions.find((month) => month.key === key);
}
