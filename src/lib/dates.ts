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

const dayMonthFormat = new Intl.DateTimeFormat("nl-BE", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * A period as short as it stays clear: "21–25 sep 2026", "28 sep – 3 okt 2026",
 * "29 dec 2026 – 2 jan 2027", a single date, or null when there is none.
 */
export function formatPeriod(startsOn: string | null, endsOn: string | null): string | null {
  if (startsOn && endsOn && startsOn !== endsOn) {
    if (startsOn.slice(0, 7) === endsOn.slice(0, 7)) {
      return `${Number(startsOn.slice(8, 10))}–${formatDate(endsOn)}`;
    }
    if (startsOn.slice(0, 4) === endsOn.slice(0, 4)) {
      return `${dayMonthFormat.format(new Date(`${startsOn}T00:00:00Z`))} – ${formatDate(endsOn)}`;
    }
    return `${formatDate(startsOn)} – ${formatDate(endsOn)}`;
  }
  const single = startsOn ?? endsOn;
  return single ? formatDate(single) : null;
}
