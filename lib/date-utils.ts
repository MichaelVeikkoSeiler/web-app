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

/**
 * Ob eine saisonale Aufgabe (Rückschnitt, Düngen) aktuell fällig ist: der Monat
 * liegt im Zeitraum UND die Aufgabe wurde in diesem Durchgang des Zeitraums
 * noch nicht erledigt (lastDoneAt liegt vor dem Start des aktuellen Durchgangs).
 */
export function isTaskDueThisPeriod(
  now: Date,
  startMonth: number | null,
  endMonth: number | null,
  lastDoneAt: Date | null,
): boolean {
  if (!startMonth || !endMonth) return false;
  const currentMonth = now.getMonth() + 1;
  if (!isMonthInRange(currentMonth, startMonth, endMonth)) return false;
  if (!lastDoneAt) return true;

  const wraps = startMonth > endMonth;
  const periodStartYear =
    !wraps || currentMonth >= startMonth ? now.getFullYear() : now.getFullYear() - 1;
  const periodStart = new Date(periodStartYear, startMonth - 1, 1);
  return lastDoneAt < periodStart;
}
