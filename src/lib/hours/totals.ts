import { add, cents, forMinutes, type Cents } from "@/lib/money";
import { minutesBetween } from "@/lib/time";

export type TimedEntry = {
  startedAt: string;
  endedAt: string | null;
  hourlyRateCents: number;
};

export type EntryTotals = { minutes: number; amount: Cents };

/** Minutes and amount of one entry. A running entry counts up to `now`. */
export function entryTotals(entry: TimedEntry, now: Date = new Date()): EntryTotals {
  const minutes = minutesBetween(entry.startedAt, entry.endedAt ?? now.toISOString());
  return { minutes, amount: forMinutes(cents(entry.hourlyRateCents), minutes) };
}

/** Totals of several entries: each entry is rounded once, then summed. */
export function sumEntries(entries: readonly TimedEntry[], now: Date = new Date()): EntryTotals {
  const totals = entries.map((entry) => entryTotals(entry, now));
  return {
    minutes: totals.reduce((sum, total) => sum + total.minutes, 0),
    amount: add(...totals.map((total) => total.amount)),
  };
}
