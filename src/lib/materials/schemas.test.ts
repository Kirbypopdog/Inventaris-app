import { describe, expect, it } from "vitest";
import {
  catalogUsageSchema,
  materialRow,
  materialSchema,
  otherUsageSchema,
  usageUpdateSchema,
} from "./schemas";

const jobId = "bbbbbbbb-0000-4000-8000-000000000001";
const materialId = "dddddddd-0000-4000-8000-000000000001";

describe("materialSchema", () => {
  const valid = {
    name: " Vijzen 4x40 ",
    unit: "stuk",
    packagePrice: "12,50",
    unitsPerPackage: "200",
    supplier: "",
    margin: "",
  };

  it("maps a package to the database columns", () => {
    const result = materialSchema.parse(valid);
    expect(materialRow(result)).toEqual({
      name: "Vijzen 4x40",
      unit: "stuk",
      package_price_cents: 1250,
      units_per_package: 200,
      supplier: null,
      margin_bp: null,
    });
  });

  it("keeps a margin for this material", () => {
    expect(materialRow(materialSchema.parse({ ...valid, margin: "30" })).margin_bp).toBe(3000);
  });

  it("allows a free item and a fractional package, like a roll of 2,5 m", () => {
    const result = materialSchema.parse({ ...valid, packagePrice: "0", unitsPerPackage: "2,5" });
    expect(result.packagePrice).toBe(0);
    expect(result.unitsPerPackage).toBe(2.5);
  });

  it.each([
    [{ name: " " }, "naam"],
    [{ unit: "" }, "eenheid"],
    [{ packagePrice: "-1" }, "prijs van de verpakking"],
    [{ packagePrice: "twaalf" }, "prijs van de verpakking"],
    [{ unitsPerPackage: "0" }, "in één verpakking"],
    [{ margin: "-5" }, "marge"],
  ])("refuses %j", (change, message) => {
    const result = materialSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});

describe("catalogUsageSchema", () => {
  const valid = { jobId, materialId, quantity: "35", per: "unit", usedOn: "2026-09-26" };

  it("reads a quantity in units or packages", () => {
    expect(catalogUsageSchema.parse(valid).quantity).toBe(35);
    expect(catalogUsageSchema.parse({ ...valid, quantity: "2", per: "package" }).per).toBe(
      "package",
    );
  });

  it.each([
    [{ materialId: "" }, "Kies een materiaal"],
    [{ quantity: "0" }, "aantal"],
    [{ per: "doos" }, "per verpakking"],
    [{ usedOn: "" }, "datum"],
  ])("refuses %j", (change, message) => {
    const result = catalogUsageSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});

describe("otherUsageSchema", () => {
  it("reads an item bought for one job", () => {
    const result = otherUsageSchema.parse({
      jobId,
      description: "Werkbladolie",
      quantity: "1",
      unit: "fles",
      unitPrice: "18,99",
      usedOn: "2026-09-26",
    });
    expect(result).toMatchObject({ quantity: 1, unitPrice: 1899, unit: "fles" });
  });
});

describe("usageUpdateSchema", () => {
  it("reads a corrected quantity", () => {
    expect(usageUpdateSchema.parse({ quantity: "40", usedOn: "2026-09-25" })).toEqual({
      quantity: 40,
      usedOn: "2026-09-25",
    });
  });
});
