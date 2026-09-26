import { describe, expect, it } from "vitest";
import { memberErrorMessage } from "./errors";
import {
  memberIdSchema,
  memberUpdateSchema,
  newMemberSchema,
  passwordResetSchema,
} from "./schemas";

describe("newMemberSchema", () => {
  it("normalises the input", () => {
    expect(
      newMemberSchema.parse({
        email: " Piet@Voorbeeld.be ",
        displayName: " Piet ",
        role: "owner",
        temporaryPassword: "tijdelijk-123",
      }),
    ).toEqual({
      email: "piet@voorbeeld.be",
      displayName: "Piet",
      role: "owner",
      temporaryPassword: "tijdelijk-123",
    });
  });

  it("rejects an empty name and an unknown role with Dutch messages", () => {
    const result = newMemberSchema.safeParse({
      email: "piet@voorbeeld.be",
      displayName: "  ",
      role: "baas",
      temporaryPassword: "kort",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      "Geef een naam in.",
      "Kies een rol.",
      "Het wachtwoord moet minstens 10 tekens lang zijn.",
    ]);
  });
});

describe("memberUpdateSchema", () => {
  it("requires a valid user id", () => {
    expect(
      memberUpdateSchema.safeParse({ userId: "abc", displayName: "Piet", role: "admin" }).success,
    ).toBe(false);
  });
});

describe("memberIdSchema", () => {
  it("accepts a uuid", () => {
    expect(memberIdSchema.safeParse("11111111-1111-4111-8111-111111111111").success).toBe(true);
  });
});

describe("memberErrorMessage", () => {
  it.each([
    ["23505", /al lid/],
    ["P0002", /niet gevonden/],
    ["42501", /eigen rol/],
    ["XX000", /iets mis/],
  ])("maps %s", (code, message) => {
    expect(memberErrorMessage({ code })).toMatch(message);
  });
});

describe("passwordResetSchema", () => {
  it("requires a valid user id and a long enough password", () => {
    expect(
      passwordResetSchema.safeParse({
        userId: "11111111-1111-4111-8111-111111111111",
        temporaryPassword: "tijdelijk-123",
      }).success,
    ).toBe(true);
    expect(
      passwordResetSchema.safeParse({
        userId: "11111111-1111-4111-8111-111111111111",
        temporaryPassword: "kort",
      }).success,
    ).toBe(false);
  });
});
