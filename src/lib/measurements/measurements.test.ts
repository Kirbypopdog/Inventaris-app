import { describe, expect, it } from "vitest";
import { formatDimensions } from "./format";
import { measurementRow, measurementSchema } from "./schemas";

const jobId = "bbbbbbbb-0000-4000-8000-000000000001";
const valid = { jobId, label: " Kast hal ", width: "1200", height: "2 400", depth: "", note: "" };

describe("measurementSchema", () => {
  it("reads sizes in whole mm, spaces between the digits are fine", () => {
    expect(measurementRow(measurementSchema.parse({ ...valid, depth: "1 050" }))).toEqual({
      label: "Kast hal",
      width_mm: 1200,
      height_mm: 2400,
      depth_mm: 1050,
      note: null,
    });
  });

  it("needs at least one size", () => {
    const result = measurementSchema.safeParse({ ...valid, width: "", height: " " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Vul minstens één maat in.");
  });

  it.each(["12,5", "12.5", "1.050", "0", "-5", "100001", "1200mm"])(
    "refuses the size %j",
    (width) => {
      const result = measurementSchema.safeParse({ ...valid, width });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain("hele millimeter");
    },
  );

  it("needs a label", () => {
    expect(measurementSchema.safeParse({ ...valid, label: " " }).success).toBe(false);
  });
});

describe("formatDimensions", () => {
  it("shows the measured sizes only", () => {
    expect(formatDimensions({ widthMm: 1200, heightMm: 2400, depthMm: 600 })).toBe(
      "B 1200 × H 2400 × D 600 mm",
    );
    expect(formatDimensions({ widthMm: 5320, heightMm: null, depthMm: null })).toBe("B 5320 mm");
    expect(formatDimensions({ widthMm: null, heightMm: 900, depthMm: 350 })).toBe(
      "H 900 × D 350 mm",
    );
    expect(formatDimensions({ widthMm: null, heightMm: null, depthMm: null })).toBe("");
  });
});
