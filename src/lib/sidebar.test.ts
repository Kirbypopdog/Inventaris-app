import { describe, expect, it } from "vitest";
import { isSidebarCollapsed, sidebarCookie } from "./sidebar";

describe("isSidebarCollapsed", () => {
  it("is folded only when the cookie says so", () => {
    expect(isSidebarCollapsed("collapsed")).toBe(true);
    expect(isSidebarCollapsed(undefined)).toBe(false);
    expect(isSidebarCollapsed("iets anders")).toBe(false);
  });
});

describe("sidebarCookie", () => {
  it("remembers folding for a year and forgets it when opened", () => {
    expect(sidebarCookie(true)).toBe("sidebar=collapsed; path=/; max-age=31536000; samesite=lax");
    expect(sidebarCookie(false)).toBe("sidebar=; path=/; max-age=0; samesite=lax");
  });
});
