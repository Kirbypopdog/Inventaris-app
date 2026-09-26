const dateFormat = new Intl.DateTimeFormat("nl-BE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a date-only value from the database ("2026-10-01") as "1 okt 2026". */
export function formatDate(value: string): string {
  return dateFormat.format(new Date(`${value}T00:00:00Z`));
}

/** "1 okt 2026 – 5 okt 2026", a single date, or null when there is none. */
export function formatPeriod(startsOn: string | null, endsOn: string | null): string | null {
  if (startsOn && endsOn && startsOn !== endsOn) {
    return `${formatDate(startsOn)} – ${formatDate(endsOn)}`;
  }
  const single = startsOn ?? endsOn;
  return single ? formatDate(single) : null;
}
