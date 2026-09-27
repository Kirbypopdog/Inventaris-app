import { describe, expect, it } from "vitest";
import { isVatRate } from "@/lib/money";
import { documentTotals, lineNet } from "./totals";

describe("lineNet", () => {
  it("multiplies quantity by unit price, rounded once", () => {
    expect(lineNet({ quantity: 2, unitPriceCents: 45000, vatRate: 21 })).toBe(90000);
    // 2,5 m at €12,35 = 3087,5 cent
    expect(lineNet({ quantity: 2.5, unitPriceCents: 1235, vatRate: 21 })).toBe(3088);
  });
});

describe("documentTotals", () => {
  it("adds VAT per rate on the sum of the lines", () => {
    const totals = documentTotals([
      { quantity: 1, unitPriceCents: 10000, vatRate: 21 },
      { quantity: 1, unitPriceCents: 5050, vatRate: 21 },
      { quantity: 10, unitPriceCents: 4500, vatRate: 6 },
    ]);
    expect(totals.perRate).toEqual([
      { vatRate: 6, net: 45000, vat: 2700 },
      { vatRate: 21, net: 15050, vat: 3161 },
    ]);
    expect(totals.totalNet).toBe(60050);
    expect(totals.totalVat).toBe(5861);
    expect(totals.totalGross).toBe(65911);
  });

  it("is zero without lines", () => {
    expect(documentTotals([]).totalGross).toBe(0);
  });

  it("refuses an unknown VAT rate", () => {
    expect(() => documentTotals([{ quantity: 1, unitPriceCents: 100, vatRate: 7 }])).toThrow(
      RangeError,
    );
  });
});

describe("isVatRate", () => {
  it("knows the Belgian rates", () => {
    expect([0, 6, 12, 21].every(isVatRate)).toBe(true);
    expect(isVatRate(7)).toBe(false);
  });
});
