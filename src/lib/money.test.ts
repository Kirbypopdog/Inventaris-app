import { describe, expect, it } from "vitest";
import {
  add,
  cents,
  forMinutes,
  formatEuro,
  multiply,
  parseEuro,
  partOfPackage,
  percentageOf,
  subtract,
  vatBreakdown,
  withMargin,
} from "./money";

describe("cents", () => {
  it("accepts integers", () => {
    expect(cents(1250)).toBe(1250);
  });

  it("rejects fractions and non-numbers", () => {
    expect(() => cents(12.5)).toThrow(RangeError);
    expect(() => cents(Number.NaN)).toThrow(RangeError);
    expect(() => cents(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("normalises negative zero", () => {
    expect(Object.is(cents(-0), 0)).toBe(true);
  });
});

describe("add / subtract", () => {
  it("adds any number of amounts", () => {
    expect(add(cents(100), cents(250), cents(-50))).toBe(300);
    expect(add()).toBe(0);
  });

  it("subtracts", () => {
    expect(subtract(cents(1000), cents(1250))).toBe(-250);
  });
});

describe("partOfPackage", () => {
  it("prices part of a box of screws", () => {
    // box of 200 screws at €12,00 -> 35 screws = €2,10
    expect(partOfPackage(cents(1200), 200, 35)).toBe(210);
  });

  it("rounds only once, on the total", () => {
    // €9,99 for 100 pieces -> 1 piece is 9,99 cent, 3 pieces is 29,97 -> 30 cent
    expect(partOfPackage(cents(999), 100, 3)).toBe(30);
  });

  it("supports fractional quantities", () => {
    // roll of 10 m at €25,00 -> 2,5 m = €6,25
    expect(partOfPackage(cents(2500), 10, 2.5)).toBe(625);
  });

  it("rounds half away from zero", () => {
    expect(partOfPackage(cents(1), 2, 1)).toBe(1);
    expect(partOfPackage(cents(-1), 2, 1)).toBe(-1);
  });

  it("rejects an empty package", () => {
    expect(() => partOfPackage(cents(1200), 0, 1)).toThrow(RangeError);
    expect(() => partOfPackage(cents(1200), -5, 1)).toThrow(RangeError);
  });
});

describe("forMinutes", () => {
  it("multiplies the hourly rate by the worked time", () => {
    expect(forMinutes(cents(5000), 90)).toBe(7500);
  });

  it("rounds once", () => {
    // €45,00/h for 7 minutes = €5,25
    expect(forMinutes(cents(4500), 7)).toBe(525);
    // €47,00/h for 1 minute = 78,33 cent -> 78
    expect(forMinutes(cents(4700), 1)).toBe(78);
  });

  it("rejects invalid minutes", () => {
    expect(() => forMinutes(cents(5000), -1)).toThrow(RangeError);
    expect(() => forMinutes(cents(5000), 1.5)).toThrow(RangeError);
  });
});

describe("multiply", () => {
  it("multiplies kilometres by a rate", () => {
    // 37,4 km at €0,43 = €16,08
    expect(multiply(cents(43), 37.4)).toBe(1608);
  });
});

describe("percentageOf / withMargin", () => {
  it("calculates a percentage in basis points", () => {
    expect(percentageOf(cents(10000), 1250)).toBe(1250);
  });

  it("adds a margin", () => {
    expect(withMargin(cents(1999), 1500)).toBe(2299); // 1999 + 299,85 -> 300
  });

  it("rejects fractional basis points", () => {
    expect(() => percentageOf(cents(100), 12.5)).toThrow(RangeError);
  });
});

describe("vatBreakdown", () => {
  it("calculates VAT per rate on the sum of the lines", () => {
    const result = vatBreakdown([
      { net: cents(333), vatRate: 21 },
      { net: cents(333), vatRate: 21 },
      { net: cents(333), vatRate: 21 },
      { net: cents(10000), vatRate: 6 },
    ]);
    // per line 69,93 -> 70 cent, three times would be 210; on the sum 999 * 21% = 209,79 -> 210
    expect(result.perRate).toEqual([
      { vatRate: 6, net: 10000, vat: 600 },
      { vatRate: 21, net: 999, vat: 210 },
    ]);
    expect(result.totalNet).toBe(10999);
    expect(result.totalVat).toBe(810);
    expect(result.totalGross).toBe(11809);
  });

  it("differs from per-line rounding where it matters", () => {
    // 3 × €0,12 at 21%: per line 2,52 -> 3 cent (9 total), on the sum 36 * 21% = 7,56 -> 8
    const result = vatBreakdown([
      { net: cents(12), vatRate: 21 },
      { net: cents(12), vatRate: 21 },
      { net: cents(12), vatRate: 21 },
    ]);
    expect(result.totalVat).toBe(8);
  });

  it("handles credit notes (negative amounts)", () => {
    const result = vatBreakdown([{ net: cents(-10000), vatRate: 21 }]);
    expect(result.totalVat).toBe(-2100);
    expect(result.totalGross).toBe(-12100);
  });

  it("returns zeros for no lines", () => {
    expect(vatBreakdown([])).toEqual({ perRate: [], totalNet: 0, totalVat: 0, totalGross: 0 });
  });
});

describe("parseEuro", () => {
  it.each([
    ["12,50", 1250],
    ["12.50", 1250],
    ["12,5", 1250],
    ["12", 1200],
    ["0,05", 5],
    ["€ 1.234,56", 123456],
    ["1.234", 123400],
    ["1.234.567", 123456700],
    [" 7 ", 700],
    ["-3,5", -350],
  ])("parses %s", (input, expected) => {
    expect(parseEuro(input)).toBe(expected);
  });

  it.each(["", "abc", "12,345", "1,2,3", "12.3.4", "--5", "1e5", ","])("rejects %s", (input) => {
    expect(parseEuro(input)).toBeNull();
  });
});

describe("formatEuro", () => {
  it("formats in Belgian notation", () => {
    // Intl uses a non-breaking space between the symbol and the amount
    expect(formatEuro(cents(123456)).replace(/\s/g, " ")).toBe("€ 1.234,56");
    expect(formatEuro(cents(-350)).replace(/\s/g, " ")).toBe("€ -3,50");
  });
});
