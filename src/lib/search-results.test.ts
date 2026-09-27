import { describe, expect, it } from "vitest";
import { searchResultHref, searchResultSchema } from "./search-results";

const id = "bbbbbbbb-0000-4000-8000-000000000001";

describe("searchResultSchema", () => {
  it("reads a result from the database", () => {
    expect(
      searchResultSchema.parse({ kind: "job", id, title: "Trap in eik", detail: null, rank: 0.1 }),
    ).toMatchObject({ kind: "job", title: "Trap in eik" });
  });

  it("refuses an unknown kind", () => {
    expect(
      searchResultSchema.safeParse({ kind: "invoice", id, title: "x", detail: null, rank: 0 })
        .success,
    ).toBe(false);
  });
});

describe("searchResultHref", () => {
  it.each([
    ["job", `/jobs/${id}`],
    ["customer", `/klanten/${id}`],
    ["quote", `/offertes/${id}`],
    ["material", `/materiaal/${id}`],
  ] as const)("links a %s", (kind, href) => {
    expect(searchResultHref({ kind, id })).toBe(href);
  });
});
