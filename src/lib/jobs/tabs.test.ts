import { describe, expect, it } from "vitest";
import { jobTabHref, parseJobTab } from "./tabs";

describe("parseJobTab", () => {
  it("accepts the known tabs", () => {
    expect(parseJobTab("uren")).toBe("uren");
    expect(parseJobTab("gegevens")).toBe("gegevens");
  });

  it("opens the overview for anything else", () => {
    expect(parseJobTab(undefined)).toBe("overzicht");
    expect(parseJobTab("onbekend")).toBe("overzicht");
    expect(parseJobTab(["uren", "ritten"])).toBe("overzicht");
  });
});

describe("jobTabHref", () => {
  it("leaves the overview without a parameter", () => {
    expect(jobTabHref("abc", "overzicht")).toBe("/jobs/abc");
    expect(jobTabHref("abc", "ritten")).toBe("/jobs/abc?tab=ritten");
  });
});
