import { describe, expect, it } from "vitest";
import { distanceIssue, travelSettingsSchema, tripSchema, tripUpdateSchema } from "./schemas";

const jobId = "bbbbbbbb-0000-4000-8000-000000000001";

describe("tripSchema", () => {
  const valid = { jobId, tripDate: "2026-09-26", distance: "42,5", note: " Opmeten " };

  it("reads a trip", () => {
    expect(tripSchema.parse(valid)).toEqual({
      jobId,
      tripDate: "2026-09-26",
      distance: 42.5,
      note: "Opmeten",
    });
  });

  it("allows an empty distance and note", () => {
    const result = tripSchema.parse({ ...valid, distance: " ", note: "" });
    expect(result.distance).toBeNull();
    expect(result.note).toBeNull();
  });

  it.each([
    [{ distance: "0" }, "afstand"],
    [{ distance: "42,55" }, "afstand"],
    [{ distance: "20000" }, "afstand"],
    [{ distance: "ver" }, "afstand"],
    [{ tripDate: "" }, "datum"],
    [{ jobId: "x" }, "Onbekende job"],
  ])("refuses %j", (change, message) => {
    const result = tripSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});

describe("tripUpdateSchema", () => {
  it("reads a correction", () => {
    expect(tripUpdateSchema.parse({ tripDate: "2026-09-25", distance: "30", note: "" })).toEqual({
      tripDate: "2026-09-25",
      distance: 30,
      note: null,
    });
  });
});

describe("distanceIssue", () => {
  it("asks for a distance only for trips per km", () => {
    expect(distanceIssue("per_km", null)).toContain("afstand");
    expect(distanceIssue("per_km", 12)).toBeNull();
    expect(distanceIssue("flat", null)).toBeNull();
  });
});

describe("travelSettingsSchema", () => {
  it("reads the general travel settings", () => {
    expect(
      travelSettingsSchema.parse({ method: "per_km", kmRate: "0,43", tripFlat: "25" }),
    ).toEqual({ method: "per_km", kmRate: 43, tripFlat: 2500 });
  });

  it.each([
    [{ method: "fiets" }, "Kies hoe"],
    [{ kmRate: "-1" }, "per km"],
    [{ tripFlat: "" }, "per rit"],
  ])("refuses %j", (change, message) => {
    const result = travelSettingsSchema.safeParse({
      method: "flat",
      kmRate: "0",
      tripFlat: "25",
      ...change,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});
