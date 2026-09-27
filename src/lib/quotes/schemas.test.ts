import { describe, expect, it } from "vitest";
import { quoteDetailsRow, quoteDetailsSchema, quoteLineRow, quoteLineSchema } from "./schemas";

describe("quoteLineSchema", () => {
  const valid = {
    description: " Keukenkast in eik ",
    quantity: "2",
    unit: "stuk",
    unitPrice: "450,00",
    vatRate: "6",
  };

  it("maps a line to the database columns", () => {
    expect(quoteLineRow(quoteLineSchema.parse(valid))).toEqual({
      description: "Keukenkast in eik",
      quantity: 2,
      unit: "stuk",
      unit_price_cents: 45000,
      vat_rate: 6,
    });
  });

  it.each([
    [{ description: "" }, "omschrijving"],
    [{ quantity: "0" }, "aantal"],
    [{ unit: " " }, "eenheid"],
    [{ unitPrice: "-5" }, "prijs"],
    [{ vatRate: "7" }, "btw-tarief"],
    [{ vatRate: "" }, "btw-tarief"],
  ])("refuses %j", (change, message) => {
    const result = quoteLineSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toContain(message);
  });
});

describe("quoteDetailsSchema", () => {
  it("maps the dates and texts", () => {
    expect(
      quoteDetailsRow(
        quoteDetailsSchema.parse({
          quoteDate: "2026-09-27",
          validUntil: "",
          intro: " Zoals besproken ",
          notes: "",
        }),
      ),
    ).toEqual({
      quote_date: "2026-09-27",
      valid_until: null,
      intro: "Zoals besproken",
      notes: null,
    });
  });

  it("refuses a validity before the quote date", () => {
    const result = quoteDetailsSchema.safeParse({
      quoteDate: "2026-09-27",
      validUntil: "2026-09-01",
      intro: "",
      notes: "",
    });
    expect(result.error?.issues[0]?.message).toContain("Geldig tot");
  });
});
