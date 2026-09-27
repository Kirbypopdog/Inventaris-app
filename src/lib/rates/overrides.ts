import { z } from "zod";
import type { TravelMethod } from "@/lib/labels";
import {
  cents,
  formatEuroInput,
  formatPercentageInput,
  parseEuro,
  parsePercentage,
} from "@/lib/money";
import { Constants } from "@/lib/supabase/database.types";

/**
 * Exceptions to the general settings, on a customer, a job or a material. An empty field
 * means "no exception": the next level applies (job > customer > general settings).
 */

const optionalAmount = (message: string) =>
  z.string().transform((value, context) => {
    if (value.trim() === "") {
      return null;
    }
    const amount = parseEuro(value);
    if (amount === null || amount < 0) {
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return amount;
  });

export const optionalMarginSchema = z.string().transform((value, context) => {
  if (value.trim() === "") {
    return null;
  }
  const margin = parsePercentage(value);
  if (margin === null) {
    context.addIssue({ code: "custom", message: "Geef de marge in procent in, bv. 15 of 12,5." });
    return z.NEVER;
  }
  return margin;
});

export const TRAVEL_OVERRIDE_FIELDS = ["travelMethod", "kmRate", "tripFlat"] as const;

export const travelOverrideShape = {
  travelMethod: z
    .union([z.literal(""), z.enum(Constants.public.Enums.travel_method)], {
      error: "Kies een geldige manier voor verplaatsingen.",
    })
    .transform((value) => (value === "" ? null : value)),
  kmRate: optionalAmount("Geef een bedrag per km in, bv. 0,43, of laat het leeg."),
  tripFlat: optionalAmount("Geef een bedrag per rit in, bv. 25,00, of laat het leeg."),
};

export type TravelOverrideInput = {
  [Field in keyof typeof travelOverrideShape]: z.output<(typeof travelOverrideShape)[Field]>;
};

/** Maps validated travel exceptions to the columns of public.customers and public.jobs. */
export function travelOverrideRow(input: TravelOverrideInput) {
  return {
    travel_method: input.travelMethod,
    km_rate_cents: input.kmRate,
    trip_flat_cents: input.tripFlat,
  };
}

type TravelOverrideRow = {
  travel_method: TravelMethod | null;
  km_rate_cents: number | null;
  trip_flat_cents: number | null;
};

/** Travel exceptions from the database as form values; no exception is an empty field. */
export function travelOverrideFormValues(row: TravelOverrideRow) {
  return {
    travelMethod: row.travel_method ?? "",
    kmRate: row.km_rate_cents === null ? "" : formatEuroInput(cents(row.km_rate_cents)),
    tripFlat: row.trip_flat_cents === null ? "" : formatEuroInput(cents(row.trip_flat_cents)),
  };
}

/** A margin from the database as a form value; no exception is an empty field. */
export function marginFormValue(marginBp: number | null): string {
  return marginBp === null ? "" : formatPercentageInput(marginBp);
}

/** The general margin on material, required (0 is allowed). */
export const generalMarginSchema = z.object({
  margin: z.string().transform((value, context) => {
    const margin = parsePercentage(value);
    if (margin === null) {
      context.addIssue({ code: "custom", message: "Geef de marge in procent in, bv. 15 of 0." });
      return z.NEVER;
    }
    return margin;
  }),
});
