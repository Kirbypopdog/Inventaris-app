import { describe, expect, it } from "vitest";
import { parseTheme } from "./theme";

describe("parseTheme", () => {
  it("keeps a fixed look", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
  });

  it("follows the device for auto, nothing or anything else", () => {
    expect(parseTheme("auto")).toBeUndefined();
    expect(parseTheme(undefined)).toBeUndefined();
    expect(parseTheme("paars")).toBeUndefined();
  });
});
