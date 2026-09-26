import { describe, expect, it } from "vitest";
import { sumTrips, tripCost } from "./totals";

describe("tripCost", () => {
  it("multiplies km by the rate per km, rounded once", () => {
    // 42,5 km × €0,43 = 1827,5 cent
    expect(tripCost({ method: "per_km", distanceKm: 42.5, rateCents: 43 })).toBe(1828);
  });

  it("uses the fixed amount of a flat trip", () => {
    expect(tripCost({ method: "flat", distanceKm: null, rateCents: 2500 })).toBe(2500);
  });

  it("refuses a trip per km without distance", () => {
    expect(() => tripCost({ method: "per_km", distanceKm: null, rateCents: 43 })).toThrow(
      RangeError,
    );
  });
});

describe("sumTrips", () => {
  it("adds up trips of both kinds", () => {
    expect(
      sumTrips([
        { method: "per_km", distanceKm: 42.5, rateCents: 43 },
        { method: "flat", distanceKm: null, rateCents: 2500 },
      ]),
    ).toBe(1828 + 2500);
  });

  it("is zero without trips", () => {
    expect(sumTrips([])).toBe(0);
  });
});
