import { describe, expect, it } from "vitest";
import { optionalVatRateSchema, vatRateSchema } from "./vat";

describe("vatRateSchema", () => {
  it("reads the Belgian rates", () => {
    expect(vatRateSchema.parse("6")).toBe(6);
    expect(vatRateSchema.parse("0")).toBe(0);
  });

  it.each(["", "7", "21%"])("refuses %j", (value) => {
    expect(vatRateSchema.safeParse(value).success).toBe(false);
  });
});

describe("optionalVatRateSchema", () => {
  it("turns an empty field into null", () => {
    expect(optionalVatRateSchema.parse("")).toBeNull();
    expect(optionalVatRateSchema.parse("21")).toBe(21);
  });

  it("refuses an unknown rate", () => {
    expect(optionalVatRateSchema.safeParse("7").success).toBe(false);
  });
});
