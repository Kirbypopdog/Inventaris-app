import { describe, expect, it } from "vitest";
import { formatIban, isValidIban, normalizeIban } from "./iban";

describe("normalizeIban", () => {
  it("removes spaces and dashes and uppercases", () => {
    expect(normalizeIban(" be68 5390-0754 7034 ")).toBe("BE68539007547034");
  });
});

describe("isValidIban", () => {
  it.each(["BE68539007547034", "NL91ABNA0417164300", "DE89370400440532013000"])(
    "accepts %s",
    (iban) => {
      expect(isValidIban(iban)).toBe(true);
    },
  );

  it.each([
    ["a wrong check digit", "BE68539007547035"],
    ["a Belgian IBAN that is too long", "BE685390075470341"],
    ["something else", "BE68 5390 0754 7034"],
    ["an empty value", ""],
  ])("refuses %s", (_reason, iban) => {
    expect(isValidIban(iban)).toBe(false);
  });
});

describe("formatIban", () => {
  it("shows groups of 4", () => {
    expect(formatIban("BE68539007547034")).toBe("BE68 5390 0754 7034");
    expect(formatIban("NL91ABNA0417164300")).toBe("NL91 ABNA 0417 1643 00");
  });
});
