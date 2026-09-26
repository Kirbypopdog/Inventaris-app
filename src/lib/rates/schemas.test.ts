import { describe, expect, it } from "vitest";
import { hourlyRateSchema } from "./schemas";

describe("hourlyRateSchema", () => {
  it("parses a Belgian amount into cents", () => {
    expect(hourlyRateSchema.parse({ name: " Plaatsing ", rate: "52,50" })).toEqual({
      name: "Plaatsing",
      rate: 5250,
    });
  });

  it.each(["", "0", "-5", "abc"])("rejects %s as rate", (rate) => {
    expect(hourlyRateSchema.safeParse({ name: "Werkplaats", rate }).success).toBe(false);
  });
});
