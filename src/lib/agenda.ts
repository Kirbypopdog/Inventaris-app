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

/** Where a bar sits in a row of consecutive days: column indexes, both inclusive. */
export type BarSpan = {
  start: number;
  end: number;
  /** The job started before the first day of the row. */
  continuesBefore: boolean;
  /** The job goes on after the last day of the row. */
  continuesAfter: boolean;
};

/** The part of a planned period that falls within these consecutive days, or null. */
export function barSpan(period: Period, days: readonly string[]): BarSpan | null {
  const first = days[0];
  const last = days[days.length - 1];
  if (!period.startsOn || first === undefined || last === undefined) {
    return null;
  }
  const end = period.endsOn ?? period.startsOn;
  if (period.startsOn > last || end < first) {
    return null;
  }
  const visibleStart = period.startsOn < first ? first : period.startsOn;
  const visibleEnd = end > last ? last : end;
  return {
    start: days.indexOf(visibleStart),
    end: days.indexOf(visibleEnd),
    continuesBefore: period.startsOn < first,
    continuesAfter: end > last,
  };
}

/**
 * Bars for one row of days, stacked in lanes so they never overlap: earlier starts first,
 * longer bars first when they start on the same day, each in the first lane that is free.
 */
export function layoutBars<T extends Period>(
  items: readonly T[],
  days: readonly string[],
): { item: T; span: BarSpan; lane: number }[] {
  const bars = items
    .map((item) => ({ item, span: barSpan(item, days) }))
    .filter((bar): bar is { item: T; span: BarSpan } => bar.span !== null)
    .sort((a, b) => a.span.start - b.span.start || b.span.end - a.span.end);
  const laneEnds: number[] = [];
  return bars.map((bar) => {
    const free = laneEnds.findIndex((end) => end < bar.span.start);
    const lane = free === -1 ? laneEnds.length : free;
    laneEnds[lane] = bar.span.end;
    return { ...bar, lane };
  });
}

/** "2026-09": a month in the URL. */
export function isMonthValue(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** The month ("2026-09") that contains this date. */
export function monthOf(value: string): string {
  return value.slice(0, 7);
}

export function addMonths(month: string, months: number): string {
  const [year = 0, monthNumber = 1] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + months, 1));
  return toValue(date).slice(0, 7);
}

/** The Mondays of the weeks that show this month, from its first to its last day. */
export function monthWeeks(month: string): string[] {
  const first = `${month}-01`;
  const last = addDays(`${addMonths(month, 1)}-01`, -1);
  const mondays: string[] = [];
  for (let monday = weekStart(first); monday <= last; monday = addDays(monday, 7)) {
    mondays.push(monday);
  }
  return mondays;
}

const monthFormat = new Intl.DateTimeFormat("nl-BE", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "september 2026" */
export function formatMonth(month: string): string {
  return monthFormat.format(toDate(`${month}-01`));
}

const weekdayFormat = new Intl.DateTimeFormat("nl-BE", { weekday: "short", timeZone: "UTC" });

/** "ma", "di", … without a trailing dot. */
export function formatWeekdayShort(value: string): string {
  return weekdayFormat.format(toDate(value)).replace(/\.$/, "");
}

/** The day of the month: 1 to 31. */
export function dayOfMonth(value: string): number {
  return Number(value.slice(8, 10));
}

export function isWeekend(value: string): boolean {
  const weekday = toDate(value).getUTCDay();
  return weekday === 0 || weekday === 6;
}
