import { entryTotals, type TimedEntry } from "@/lib/hours/totals";
import { usageCost, type PricedUsage } from "@/lib/materials/totals";
import { add, cents, subtract, withMargin, type Cents } from "@/lib/money";
import { documentTotals, type PricedLine } from "@/lib/quotes/totals";
import { toBrusselsDate } from "@/lib/time";
import { tripCost, type PricedTrip } from "@/lib/trips/totals";

/** Hours of a finished registration; a running clock is left out until it stops. */
export type AnalysisEntry = TimedEntry & { endedAt: string };
export type AnalysisUsage = PricedUsage & { marginBp: number; usedOn: string };
export type AnalysisTrip = PricedTrip & { tripDate: string };

export function isFinished(entry: TimedEntry): entry is AnalysisEntry {
  return entry.endedAt !== null;
}

export type JobCalculation = {
  minutes: number;
  /** Hours × rate. */
  labour: Cents;
  materialCost: Cents;
  /** Material cost plus its margin: what can be charged. */
  materialSale: Cents;
  travel: Cents;
  /** Labour + material with margin + travel, excl. VAT. */
  total: Cents;
  /** Accepted quotes, excl. VAT; null without an accepted quote. */
  quoteNet: Cents | null;
  /** Accepted quotes minus the total: positive means the quote covers the work. */
  difference: Cents | null;
};

/** Post-calculation of a job: what was done, compared with the accepted quote. */
export function jobCalculation({
  entries,
  usages,
  trips,
  acceptedQuoteLines,
}: {
  entries: readonly AnalysisEntry[];
  usages: readonly AnalysisUsage[];
  trips: readonly AnalysisTrip[];
  /** One list of lines per accepted quote. */
  acceptedQuoteLines: readonly (readonly PricedLine[])[];
}): JobCalculation {
  const hours = entries.map((entry) => entryTotals(entry));
  const costs = usages.map(usageCost);
  const labour = add(...hours.map((hour) => hour.amount));
  const materialCost = add(...costs);
  const materialSale = add(
    ...usages.map((usage, index) => withMargin(costs[index] ?? cents(0), usage.marginBp)),
  );
  const travel = add(...trips.map(tripCost));
  const total = add(labour, materialSale, travel);
  const quoteNet =
    acceptedQuoteLines.length > 0
      ? add(...acceptedQuoteLines.map((lines) => documentTotals(lines).totalNet))
      : null;
  return {
    minutes: hours.reduce((sum, hour) => sum + hour.minutes, 0),
    labour,
    materialCost,
    materialSale,
    travel,
    total,
    quoteNet,
    difference: quoteNet === null ? null : subtract(quoteNet, total),
  };
}

export type MonthTotals = {
  /** 1 = January */
  month: number;
  minutes: number;
  labour: Cents;
  materialCost: Cents;
  travel: Cents;
};

/** Hours, material and travel per month of a year (Belgian time), January to December. */
export function monthlyTotals(
  year: number,
  entries: readonly AnalysisEntry[],
  usages: readonly AnalysisUsage[],
  trips: readonly AnalysisTrip[],
): MonthTotals[] {
  const months: MonthTotals[] = Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    minutes: 0,
    labour: cents(0),
    materialCost: cents(0),
    travel: cents(0),
  }));
  const monthOf = (date: string): MonthTotals | undefined =>
    Number(date.slice(0, 4)) === year ? months[Number(date.slice(5, 7)) - 1] : undefined;

  for (const entry of entries) {
    const month = monthOf(toBrusselsDate(entry.startedAt));
    if (month) {
      const totals = entryTotals(entry);
      month.minutes += totals.minutes;
      month.labour = add(month.labour, totals.amount);
    }
  }
  for (const usage of usages) {
    const month = monthOf(usage.usedOn);
    if (month) {
      month.materialCost = add(month.materialCost, usageCost(usage));
    }
  }
  for (const trip of trips) {
    const month = monthOf(trip.tripDate);
    if (month) {
      month.travel = add(month.travel, tripCost(trip));
    }
  }
  return months;
}
