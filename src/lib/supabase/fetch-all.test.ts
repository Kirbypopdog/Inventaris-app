import { describe, expect, it } from "vitest";
import { fetchAll } from "./fetch-all";

describe("fetchAll", () => {
  it("keeps asking for the next page until a page is not full", async () => {
    const all = Array.from({ length: 2500 }, (_, index) => index);
    const asked: [number, number][] = [];
    const rows = await fetchAll(async (from, to) => {
      asked.push([from, to]);
      return { data: all.slice(from, to + 1), error: null };
    });
    expect(rows).toEqual(all);
    expect(asked).toEqual([
      [0, 999],
      [1000, 1999],
      [2000, 2999],
    ]);
  });

  it("throws on an error", async () => {
    await expect(
      fetchAll(async () => ({ data: null, error: { message: "boom" } })),
    ).rejects.toThrow("boom");
  });
});
