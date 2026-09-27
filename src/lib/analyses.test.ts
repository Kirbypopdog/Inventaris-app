import { describe, expect, it } from "vitest";
import { isFinished, jobCalculation, monthlyTotals } from "./analyses";

// 4 hours at €45 = €180
const entry = {
  startedAt: "2026-09-21T06:00:00Z",
  endedAt: "2026-09-21T10:00:00Z",
  hourlyRateCents: 4500,
};
// 2 plates at €64,50, 15% margin: cost €129, sale €148,35
const usage = {
  packagePriceCents: 6450,
  unitsPerPackage: 1,
  quantity: 2,
  marginBp: 1500,
  usedOn: "2026-09-22",
};
// 40 km at €0,43 = €17,20
const trip = { method: "per_km" as const, distanceKm: 40, rateCents: 43, tripDate: "2026-10-01" };

describe("jobCalculation", () => {
  it("adds hours, material with margin and travel", () => {
    const result = jobCalculation({
      entries: [entry],
      usages: [usage],
      trips: [trip],
      acceptedQuoteLines: [],
    });
    expect(result).toEqual({
      minutes: 240,
      labour: 18000,
      materialCost: 12900,
      materialSale: 14835,
      travel: 1720,
      total: 18000 + 14835 + 1720,
      quoteNet: null,
      difference: null,
    });
  });

  it("compares with the accepted quotes, excl. VAT", () => {
    const result = jobCalculation({
      entries: [entry],
      usages: [],
      trips: [],
      acceptedQuoteLines: [
        [{ quantity: 1, unitPriceCents: 15000, vatRate: 6 }],
        [{ quantity: 2, unitPriceCents: 2500, vatRate: 21 }],
      ],
    });
    expect(result.quoteNet).toBe(20000);
    // The quotes cover €200, the work was worth €180.
    expect(result.difference).toBe(2000);
  });

  it("is zero for an empty job", () => {
    const result = jobCalculation({ entries: [], usages: [], trips: [], acceptedQuoteLines: [] });
    expect(result.total).toBe(0);
    expect(result.minutes).toBe(0);
  });
});

describe("isFinished", () => {
  it("leaves out a running clock", () => {
    expect(isFinished(entry)).toBe(true);
    expect(isFinished({ ...entry, endedAt: null })).toBe(false);
  });
});

describe("monthlyTotals", () => {
  it("puts everything in its month of the chosen year", () => {
    const months = monthlyTotals(2026, [entry], [usage], [trip]);
    expect(months).toHaveLength(12);
    expect(months[8]).toEqual({
      month: 9,
      minutes: 240,
      labour: 18000,
      materialCost: 12900,
      travel: 0,
    });
    expect(months[9]).toMatchObject({ month: 10, travel: 1720, minutes: 0 });
  });

  it("uses Belgian time for hours around midnight", () => {
    // 23:30 UTC on 31 August is 01:30 on 1 September in Brussels.
    const late = {
      startedAt: "2026-08-31T23:30:00Z",
      endedAt: "2026-09-01T00:30:00Z",
      hourlyRateCents: 6000,
    };
    const months = monthlyTotals(2026, [late], [], []);
    expect(months[7]?.minutes).toBe(0);
    expect(months[8]?.minutes).toBe(60);
  });

  it("ignores other years", () => {
    const months = monthlyTotals(2025, [entry], [usage], [trip]);
    expect(months.every((month) => month.minutes === 0 && month.materialCost === 0)).toBe(true);
  });
});
