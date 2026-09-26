import { describe, expect, it } from "vitest";
import { sumUsages, usageCost } from "./totals";

describe("usageCost", () => {
  it("costs the used part of a package", () => {
    // 35 screws from a box of 200 at €12,50: 218,75 cent, rounded once.
    expect(usageCost({ packagePriceCents: 1250, unitsPerPackage: 200, quantity: 35 })).toBe(219);
  });

  it("costs whole packages and single items", () => {
    expect(usageCost({ packagePriceCents: 1250, unitsPerPackage: 200, quantity: 400 })).toBe(2500);
    expect(usageCost({ packagePriceCents: 1899, unitsPerPackage: 1, quantity: 2 })).toBe(3798);
  });
});

describe("sumUsages", () => {
  it("rounds each entry, then adds them up", () => {
    const usages = [
      { packagePriceCents: 1250, unitsPerPackage: 200, quantity: 35 },
      { packagePriceCents: 900, unitsPerPackage: 2, quantity: 3 },
    ];
    expect(sumUsages(usages)).toBe(219 + 1350);
  });

  it("is zero without entries", () => {
    expect(sumUsages([])).toBe(0);
  });
});
