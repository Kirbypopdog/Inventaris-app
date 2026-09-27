import { describe, expect, it } from "vitest";
import { isSidebarCollapsed } from "./sidebar";

describe("isSidebarCollapsed", () => {
  it("is folded only when the cookie says so", () => {
    expect(isSidebarCollapsed("collapsed")).toBe(true);
    expect(isSidebarCollapsed(undefined)).toBe(false);
    expect(isSidebarCollapsed("iets anders")).toBe(false);
  });
});
