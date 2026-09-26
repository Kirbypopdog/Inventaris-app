import { describe, expect, it } from "vitest";
import {
  emailSchema,
  loginPasswordSchema,
  newPasswordSchema,
  passwordChangeSchema,
} from "./schemas";

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

describe("loginPasswordSchema", () => {
  it("only requires something to be filled in", () => {
    expect(loginPasswordSchema.safeParse("x").success).toBe(true);
    expect(loginPasswordSchema.safeParse("").success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("requires at least 10 characters", () => {
    expect(newPasswordSchema.safeParse("123456789").success).toBe(false);
    expect(newPasswordSchema.safeParse("1234567890").success).toBe(true);
  });

  it("rejects passwords longer than 72 bytes", () => {
    expect(newPasswordSchema.safeParse("a".repeat(72)).success).toBe(true);
    expect(newPasswordSchema.safeParse("a".repeat(73)).success).toBe(false);
    // 'é' takes two bytes
    expect(newPasswordSchema.safeParse("é".repeat(37)).success).toBe(false);
  });
});

describe("passwordChangeSchema", () => {
  it("requires both passwords to match", () => {
    const result = passwordChangeSchema.safeParse({
      password: "eenlangwachtwoord",
      confirmation: "eenanderwachtwoord",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("De twee wachtwoorden zijn niet gelijk.");
  });

  it("accepts matching passwords", () => {
    expect(
      passwordChangeSchema.safeParse({
        password: "eenlangwachtwoord",
        confirmation: "eenlangwachtwoord",
      }).success,
    ).toBe(true);
  });
});
