import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("explains that an unknown address has no access", () => {
    expect(authErrorMessage({ code: "otp_disabled", status: 422 })).toMatch(/geen toegang/);
  });

  it("explains an expired or wrong code", () => {
    expect(authErrorMessage({ code: "otp_expired", status: 403 })).toMatch(/verlopen/);
  });

  it("explains rate limits, also without a code", () => {
    expect(authErrorMessage({ code: "over_email_send_rate_limit" })).toMatch(/te veel/);
    expect(authErrorMessage({ status: 429 })).toMatch(/te veel/);
  });

  it("falls back to a generic message", () => {
    expect(authErrorMessage({ code: "unexpected_failure", status: 500 })).toMatch(/iets mis/);
    expect(authErrorMessage({})).toMatch(/iets mis/);
  });
});
