import { describe, expect, it } from "vitest";
import { codeSchema, emailSchema } from "./schemas";

describe("emailSchema", () => {
  it("normalises the address", () => {
    expect(emailSchema.parse("  Jan@Voorbeeld.BE ")).toBe("jan@voorbeeld.be");
  });

  it("rejects invalid addresses with a Dutch message", () => {
    const result = emailSchema.safeParse("jan@");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Geef een geldig e-mailadres in.");
  });
});

describe("codeSchema", () => {
  it("accepts a code with spaces", () => {
    expect(codeSchema.parse("123 456")).toBe("123456");
  });

  it("accepts longer codes", () => {
    expect(codeSchema.parse("12345678")).toBe("12345678");
  });

  it.each(["12345", "abcdef", "", "12345678901"])("rejects %s", (input) => {
    expect(codeSchema.safeParse(input).success).toBe(false);
  });
});
