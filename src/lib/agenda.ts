/**
 * Week logic for the agenda. Dates are date-only strings ("2026-09-28"), calculated in UTC
 * so daylight saving time never shifts a day.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

function toValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isDateValue(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = toDate(value);
  return !Number.isNaN(date.getTime()) && toValue(date) === value;
}

export function addDays(value: string, days: number): string {
  return toValue(new Date(toDate(value).getTime() + days * DAY_MS));
}

/** The Monday of the week that contains this date. */
export function weekStart(value: string): string {
  const weekday = (toDate(value).getUTCDay() + 6) % 7; // Monday = 0
  return addDays(value, -weekday);
}

/** The 7 days of the week that starts on this Monday. */
export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** ISO week number (weeks start on Monday; week 1 contains the first Thursday). */
export function isoWeekNumber(value: string): number {
  const thursday = addDays(weekStart(value), 3);
  const firstThursday = addDays(weekStart(`${thursday.slice(0, 4)}-01-04`), 3);
  return (
    1 + Math.round((toDate(thursday).getTime() - toDate(firstThursday).getTime()) / (7 * DAY_MS))
  );
}

export type Period = { startsOn: string | null; endsOn: string | null };

/**
 * Whether a job is planned on this day. Without an end date, a job lasts one day; without
 * a start date, it is not planned.
 */
export function coversDay(period: Period, day: string): boolean {
  if (!period.startsOn) {
    return false;
  }
  const end = period.endsOn ?? period.startsOn;
  return period.startsOn <= day && day <= end;
}

const dayFormat = new Intl.DateTimeFormat("nl-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** "maandag 28 september" */
export function formatDay(value: string): string {
  return dayFormat.format(toDate(value));
}
