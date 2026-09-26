import { describe, expect, it } from "vitest";
import { cleanSearchTerm, ilikeAnyFilter } from "./search";

describe("cleanSearchTerm", () => {
  it("keeps letters, digits and common punctuation", () => {
    expect(cleanSearchTerm("  Jan  Peeters-De Smet ")).toBe("Jan Peeters-De Smet");
    expect(cleanSearchTerm("Sint-Kruis 8310")).toBe("Sint-Kruis 8310");
    expect(cleanSearchTerm("Van & Zoon")).toBe("Van & Zoon");
    expect(cleanSearchTerm("Hélène D'hondt")).toBe("Hélène D'hondt");
  });

  it("removes characters that have a meaning in filters", () => {
    expect(cleanSearchTerm('a,b(c)"d%e_f*g\\h')).toBe("a b c d e f g h");
  });

  it("handles missing and repeated query parameters", () => {
    expect(cleanSearchTerm(undefined)).toBe("");
    expect(cleanSearchTerm(["keuken", "bad"])).toBe("keuken");
  });

  it("limits the length", () => {
    expect(cleanSearchTerm("a".repeat(500))).toHaveLength(100);
  });
});

describe("ilikeAnyFilter", () => {
  it("builds an or-filter over the columns", () => {
    expect(ilikeAnyFilter(["name", "city"], "brugge")).toBe(
      'name.ilike."%brugge%",city.ilike."%brugge%"',
    );
  });

  it("returns null for an empty term", () => {
    expect(ilikeAnyFilter(["name"], "  ")).toBeNull();
    expect(ilikeAnyFilter(["name"], "%%")).toBeNull();
  });
});
