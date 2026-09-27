import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  generalMarginSchema,
  marginFormValue,
  optionalMarginSchema,
  travelOverrideFormValues,
  travelOverrideRow,
  travelOverrideShape,
} from "./overrides";

const schema = z.object(travelOverrideShape);

describe("travel exceptions", () => {
  it("leaves empty fields to the next level", () => {
    const input = schema.parse({ travelMethod: "", kmRate: "", tripFlat: " " });
    expect(travelOverrideRow(input)).toEqual({
      travel_method: null,
      km_rate_cents: null,
      trip_flat_cents: null,
    });
  });

  it("reads a method and amounts", () => {
    const input = schema.parse({ travelMethod: "flat", kmRate: "0,50", tripFlat: "35" });
    expect(travelOverrideRow(input)).toEqual({
      travel_method: "flat",
      km_rate_cents: 50,
      trip_flat_cents: 3500,
    });
  });

  it.each([
    [{ travelMethod: "fiets" }, "geldige manier"],
    [{ kmRate: "-1" }, "per km"],
    [{ tripFlat: "veel" }, "per rit"],
  ])("refuses %j", (change, message) => {
    const result = schema.safeParse({ travelMethod: "", kmRate: "", tripFlat: "", ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});

describe("optionalMarginSchema", () => {
  it("reads a percentage as basis points, or null when empty", () => {
    expect(optionalMarginSchema.parse("15")).toBe(1500);
    expect(optionalMarginSchema.parse("0")).toBe(0);
    expect(optionalMarginSchema.parse("")).toBeNull();
  });

  it("refuses something that is not a percentage", () => {
    expect(optionalMarginSchema.safeParse("-5").success).toBe(false);
  });
});

describe("form values", () => {
  it("shows no exception as empty fields", () => {
    expect(
      travelOverrideFormValues({ travel_method: null, km_rate_cents: null, trip_flat_cents: null }),
    ).toEqual({ travelMethod: "", kmRate: "", tripFlat: "" });
    expect(marginFormValue(null)).toBe("");
  });

  it("shows exceptions so the schema reads them back", () => {
    const values = travelOverrideFormValues({
      travel_method: "per_km",
      km_rate_cents: 50,
      trip_flat_cents: 3500,
    });
    expect(values).toEqual({ travelMethod: "per_km", kmRate: "0,50", tripFlat: "35,00" });
    expect(travelOverrideRow(schema.parse(values))).toEqual({
      travel_method: "per_km",
      km_rate_cents: 50,
      trip_flat_cents: 3500,
    });
    expect(optionalMarginSchema.parse(marginFormValue(1250))).toBe(1250);
  });
});

describe("generalMarginSchema", () => {
  it("needs a percentage", () => {
    expect(generalMarginSchema.parse({ margin: "15" }).margin).toBe(1500);
    expect(generalMarginSchema.safeParse({ margin: "" }).success).toBe(false);
  });
});
