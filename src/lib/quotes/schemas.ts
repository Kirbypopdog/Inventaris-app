import { z } from "zod";
import { optionalText } from "@/lib/forms";
import { parseEuro, type VatRate } from "@/lib/money";
import { parseQuantity } from "@/lib/quantity";
import { isVatRate } from "./totals";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Geef een datum in." });

export const QUOTE_DETAILS_FIELDS = ["quoteDate", "validUntil", "intro", "notes"] as const;

/** The dates and texts of a quote. */
export const quoteDetailsSchema = z
  .object({
    quoteDate: dateSchema,
    validUntil: z
      .union([z.literal(""), dateSchema])
      .transform((value) => (value === "" ? null : value)),
    intro: optionalText(5000, "De inleiding is te lang (maximaal 5000 tekens)."),
    notes: optionalText(5000, "De voorwaarden zijn te lang (maximaal 5000 tekens)."),
  })
  .refine((quote) => !quote.validUntil || quote.validUntil >= quote.quoteDate, {
    error: "Geldig tot moet na de offertedatum liggen.",
    path: ["validUntil"],
  });

export type QuoteDetailsInput = z.infer<typeof quoteDetailsSchema>;

export function quoteDetailsRow(input: QuoteDetailsInput) {
  return {
    quote_date: input.quoteDate,
    valid_until: input.validUntil,
    intro: input.intro,
    notes: input.notes,
  };
}

export const QUOTE_LINE_FIELDS = [
  "description",
  "quantity",
  "unit",
  "unitPrice",
  "vatRate",
] as const;

/** One line of a quote: what, how many, at which price and VAT rate. */
export const quoteLineSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, { error: "Geef een omschrijving in." })
    .max(1000, { error: "De omschrijving is te lang." }),
  quantity: z.string().transform((value, context) => {
    const quantity = parseQuantity(value);
    if (quantity === null) {
      context.addIssue({ code: "custom", message: "Geef een aantal in, bv. 1 of 2,5." });
      return z.NEVER;
    }
    return quantity;
  }),
  unit: z
    .string()
    .trim()
    .min(1, { error: "Geef een eenheid in, bv. stuk, uur of m²." })
    .max(30, { error: "De eenheid is te lang." }),
  unitPrice: z.string().transform((value, context) => {
    const amount = parseEuro(value);
    if (amount === null || amount < 0) {
      context.addIssue({ code: "custom", message: "Geef een prijs per eenheid in, bv. 450,00." });
      return z.NEVER;
    }
    return amount;
  }),
  // Read strictly: an empty field must not silently become 0%.
  vatRate: z
    .enum(["0", "6", "12", "21"], { error: "Kies een btw-tarief: 0, 6, 12 of 21%." })
    .transform((value): VatRate => {
      const rate = Number(value);
      if (!isVatRate(rate)) {
        throw new RangeError(`Onbekend btw-tarief: ${value}`);
      }
      return rate;
    }),
});

export type QuoteLineInput = z.infer<typeof quoteLineSchema>;

export function quoteLineRow(input: QuoteLineInput) {
  return {
    description: input.description,
    quantity: input.quantity,
    unit: input.unit,
    unit_price_cents: input.unitPrice,
    vat_rate: input.vatRate,
  };
}
