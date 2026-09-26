/** All times are shown and entered in Belgian time, whatever the server's time zone. */
export const TIME_ZONE = "Europe/Brussels";

const partsFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function brusselsParts(date: Date) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/** Offset of Belgian time from UTC at a moment, in milliseconds (1 or 2 hours). */
function offsetAt(date: Date): number {
  const p = brusselsParts(date);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/**
 * Converts a Belgian date ("2026-10-01") and time ("08:30") to an ISO timestamp in UTC.
 * Returns null for a time that does not exist (the hour skipped when summer time starts).
 */
export function brusselsLocalToUtcIso(date: string, time: string): string | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    return null;
  }
  const [, year, month, day] = dateMatch.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  if (year === undefined || month === undefined || day === undefined) return null;
  if (hour === undefined || minute === undefined || hour > 23 || minute > 59) return null;

  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  // Try both possible offsets; keep the one that gives back the same wall-clock time.
  for (const guess of [
    wallClock - offsetAt(new Date(wallClock)),
    wallClock - 3_600_000,
    wallClock - 7_200_000,
  ]) {
    const p = brusselsParts(new Date(guess));
    if (
      p.year === year &&
      p.month === month &&
      p.day === day &&
      p.hour === hour &&
      p.minute === minute
    ) {
      return new Date(guess).toISOString();
    }
  }
  return null;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** "2026-10-01" in Belgian time, for date inputs. */
export function toBrusselsDate(iso: string): string {
  const p = brusselsParts(new Date(iso));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "08:30" in Belgian time, for time inputs and display. */
export function toBrusselsTime(iso: string): string {
  const p = brusselsParts(new Date(iso));
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Whole minutes between two moments, rounded to the nearest minute. */
export function minutesBetween(startIso: string, endIso: string): number {
  return Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60_000));
}

/** "2u 05m", "45m" */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}u ${pad(rest)}m` : `${rest}m`;
}
