import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseEnv, parsePublicEnv } from "./env";

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

describe("parseEnv", () => {
  it("validates any schema", () => {
    const schema = z.object({ SUPABASE_SECRET_KEY: z.string().min(1) });
    expect(parseEnv(schema, { SUPABASE_SECRET_KEY: "sb_secret_x" })).toEqual({
      SUPABASE_SECRET_KEY: "sb_secret_x",
    });
    expect(() => parseEnv(schema, {})).toThrow(/SUPABASE_SECRET_KEY/);
  });
});
