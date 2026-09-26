import { z } from "zod";
import { parseEuro } from "@/lib/money";

export const hourlyRateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Geef het tarief een naam, bv. 'Plaatsing'." })
    .max(100, { error: "De naam is te lang." }),
  rate: z.string().transform((value, context) => {
    const amount = parseEuro(value);
    if (amount === null || amount <= 0) {
      context.addIssue({ code: "custom", message: "Geef een bedrag per uur in, bv. 45,00." });
      return z.NEVER;
    }
    return amount;
  }),
});

/** An hourly rate as a choice in a form. */
export type RateOption = { id: string; label: string };
