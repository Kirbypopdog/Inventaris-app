import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("explains wrong credentials without saying which part is wrong", () => {
    expect(authErrorMessage({ code: "invalid_credentials", status: 400 })).toBe(
      "E-mailadres of wachtwoord klopt niet.",
    );
  });

  it("explains password problems", () => {
    expect(authErrorMessage({ code: "weak_password" })).toMatch(/te zwak/);
    expect(authErrorMessage({ code: "same_password" })).toMatch(/ander wachtwoord/);
  });

  it("explains rate limits, also without a code", () => {
    expect(authErrorMessage({ code: "over_request_rate_limit" })).toMatch(/te veel/);
    expect(authErrorMessage({ status: 429 })).toMatch(/te veel/);
  });

  it("falls back to a generic message", () => {
    expect(authErrorMessage({ code: "unexpected_failure", status: 500 })).toMatch(/iets mis/);
    expect(authErrorMessage({})).toMatch(/iets mis/);
  });
});
