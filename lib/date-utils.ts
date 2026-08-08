export function isMonthInRange(
  month: number,
  startMonth: number | null,
  endMonth: number | null,
): boolean {
  if (!startMonth || !endMonth) return false;
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }
  // Zeitraum überschreitet den Jahreswechsel (z.B. Nov - Feb)
  return month >= startMonth || month <= endMonth;
}

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "";
}

export function daysSince(date: Date | null): number | null {
  if (!date) return null;
  const diffMs = Date.now() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
