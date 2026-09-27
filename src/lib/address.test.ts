import { describe, expect, it } from "vitest";
import { formatAddress, mapsUrl } from "./address";

describe("formatAddress", () => {
  it("joins what is filled in", () => {
    expect(formatAddress("Markt 1", "8000", "Brugge")).toBe("Markt 1, 8000 Brugge");
    expect(formatAddress(null, "8000", "Brugge")).toBe("8000 Brugge");
    expect(formatAddress("Markt 1", null, null)).toBe("Markt 1");
    expect(formatAddress(null, null, null)).toBe("");
  });
});

describe("mapsUrl", () => {
  it("encodes the address", () => {
    expect(mapsUrl("Markt 1, 8000 Brugge")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Markt%201%2C%208000%20Brugge",
    );
  });
});
