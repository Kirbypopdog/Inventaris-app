import { describe, expect, it } from "vitest";
import { entryTotals, sumEntries } from "./totals";

describe("entryTotals", () => {
  it("multiplies worked minutes by the recorded rate", () => {
    expect(
      entryTotals({
        startedAt: "2026-10-01T06:00:00Z",
        endedAt: "2026-10-01T08:30:00Z",
        hourlyRateCents: 4500,
      }),
    ).toEqual({ minutes: 150, amount: 11250 });
  });

  it("counts a running entry up to now", () => {
    const now = new Date("2026-10-01T07:00:00Z");
    expect(
      entryTotals({ startedAt: "2026-10-01T06:00:00Z", endedAt: null, hourlyRateCents: 6000 }, now),
    ).toEqual({ minutes: 60, amount: 6000 });
  });
});

describe("sumEntries", () => {
  it("adds entries with different rates", () => {
    expect(
      sumEntries([
        {
          startedAt: "2026-10-01T06:00:00Z",
          endedAt: "2026-10-01T10:00:00Z",
          hourlyRateCents: 4500,
        },
        {
          startedAt: "2026-10-01T11:00:00Z",
          endedAt: "2026-10-01T11:07:00Z",
          hourlyRateCents: 4700,
        },
      ]),
    ).toEqual({ minutes: 247, amount: 18000 + 548 });
  });

  it("is zero without entries", () => {
    expect(sumEntries([])).toEqual({ minutes: 0, amount: 0 });
  });
});
