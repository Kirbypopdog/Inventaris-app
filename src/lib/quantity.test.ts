import { describe, expect, it } from "vitest";
import { formatQuantity, formatQuantityInput, parseQuantity } from "./quantity";

describe("parseQuantity", () => {
  it.each([
    ["35", 35],
    ["2,5", 2.5],
    ["2.5", 2.5],
    ["0,125", 0.125],
    [" 1 200 ", 1200],
  ])("reads %j", (input, expected) => {
    expect(parseQuantity(input)).toBe(expected);
  });

  it.each(["", "0", "0,000", "-1", "1,2345", "abc", "1,2,3", "1000000000"])(
    "refuses %j",
    (input) => {
      expect(parseQuantity(input)).toBeNull();
    },
  );
});

describe("parseQuantity with fewer decimals", () => {
  it("allows only 1 decimal for a distance", () => {
    expect(parseQuantity("42,5", 1)).toBe(42.5);
    expect(parseQuantity("42,55", 1)).toBeNull();
  });
});

describe("formatQuantity", () => {
  it("uses a decimal comma and no trailing zeros", () => {
    expect(formatQuantity(2.5)).toBe("2,5");
    expect(formatQuantity(35)).toBe("35");
    expect(formatQuantity(0.125)).toBe("0,125");
  });
});

describe("formatQuantityInput", () => {
  it.each([
    [1200, "1200"],
    [2.5, "2,5"],
  ])("formats %d as %j, and parseQuantity reads it back", (value, text) => {
    expect(formatQuantityInput(value)).toBe(text);
    expect(parseQuantity(text)).toBe(value);
  });
});
