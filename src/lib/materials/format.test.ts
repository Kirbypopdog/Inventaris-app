import { describe, expect, it } from "vitest";
import { describePrice } from "./format";

const plain = (text: string) => text.replace(/\s/g, " ");

describe("describePrice", () => {
  it("shows the package and the derived price per unit", () => {
    expect(
      plain(describePrice({ packagePriceCents: 1250, unitsPerPackage: 200, unit: "stuk" })),
    ).toBe("€ 12,50 per 200 stuk · € 0,0625 per stuk");
  });

  it("shows only the unit price for a single item", () => {
    expect(
      plain(describePrice({ packagePriceCents: 900, unitsPerPackage: 1, unit: "plaat" })),
    ).toBe("€ 9,00 per plaat");
  });

  it("handles a fractional package", () => {
    expect(plain(describePrice({ packagePriceCents: 1000, unitsPerPackage: 2.5, unit: "m" }))).toBe(
      "€ 10,00 per 2,5 m · € 4,00 per m",
    );
  });
});
