import { describe, expect, it } from "vitest";
import {
  formatBelgianVatNumber,
  isValidBelgianVatNumber,
  isValidVatNumber,
  normalizeVatNumber,
} from "./belgium";

describe("normalizeVatNumber", () => {
  it.each([
    ["BE 0123.456.749", "BE0123456749"],
    ["be0123456749", "BE0123456749"],
    ["0123.456.749", "BE0123456749"],
    ["123456749", "BE0123456749"],
    ["NL 8532.12.345B01", "NL853212345B01"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeVatNumber(input)).toBe(expected);
  });
});

describe("isValidBelgianVatNumber", () => {
  it("accepts a number with correct check digits", () => {
    // 97 - (01234567 mod 97) = 49
    expect(isValidBelgianVatNumber("BE0123456749")).toBe(true);
  });

  it("rejects a typo", () => {
    expect(isValidBelgianVatNumber("BE0123456748")).toBe(false);
    expect(isValidBelgianVatNumber("BE0123465749")).toBe(false);
  });

  it("rejects the wrong length or first digit", () => {
    expect(isValidBelgianVatNumber("BE012345674")).toBe(false);
    expect(isValidBelgianVatNumber("BE2123456749")).toBe(false);
  });
});

describe("isValidVatNumber", () => {
  it("checks Belgian numbers fully and others by format", () => {
    expect(isValidVatNumber("BE0123456749")).toBe(true);
    expect(isValidVatNumber("BE0123456748")).toBe(false);
    expect(isValidVatNumber("NL853212345B01")).toBe(true);
    expect(isValidVatNumber("X1")).toBe(false);
  });
});

describe("formatBelgianVatNumber", () => {
  it("formats for display", () => {
    expect(formatBelgianVatNumber("BE0123456749")).toBe("BE 0123.456.749");
    expect(formatBelgianVatNumber("NL853212345B01")).toBe("NL853212345B01");
  });
});
