import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./env";

describe("parsePublicEnv", () => {
  it("accepts valid values", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_123",
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://abc.supabase.co");
  });

  it("names every missing variable", () => {
    expect(() => parsePublicEnv({})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
  });

  it("rejects an invalid url", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "geen-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_123",
      }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
