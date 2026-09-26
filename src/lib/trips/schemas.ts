import { z } from "zod";
import { optionalText } from "@/lib/forms";
import { parseEuro } from "@/lib/money";
import { parseQuantity } from "@/lib/quantity";
import { Constants } from "@/lib/supabase/database.types";

/** A longer trip than this is almost certainly a typing error. */
const MAX_DISTANCE_KM = 10_000;

const DISTANCE_MESSAGE = "Geef de afstand in km in, bv. 42 of 42,5.";

/** Distance in km with at most 1 decimal, like the database keeps. Empty becomes null. */
const distanceSchema = z.string().transform((value, context) => {
  if (value.trim() === "") {
    return null;
  }
  const distance = parseQuantity(value, 1);
  if (distance === null || distance > MAX_DISTANCE_KM) {
    context.addIssue({ code: "custom", message: DISTANCE_MESSAGE });
    return z.NEVER;
  }
  return distance;
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Geef een datum in." });

const noteSchema = optionalText(500, "De notitie is te lang (maximaal 500 tekens).");

export const TRIP_FIELDS = ["jobId", "tripDate", "distance", "note"] as const;

/** A trip to a job. Whether the distance is needed depends on the job's travel terms. */
export const tripSchema = z.object({
  jobId: z.uuid({ error: "Onbekende job." }),
  tripDate: dateSchema,
  distance: distanceSchema,
  note: noteSchema,
});

export const TRIP_UPDATE_FIELDS = ["tripDate", "distance", "note"] as const;

/** Correcting a trip: date, distance and note. The rate stays as it was. */
export const tripUpdateSchema = z.object({
  tripDate: dateSchema,
  distance: distanceSchema,
  note: noteSchema,
});

/** A trip per km needs a distance; a trip for a fixed amount has none. */
export function distanceIssue(method: "per_km" | "flat", distance: number | null): string | null {
  return method === "per_km" && distance === null ? DISTANCE_MESSAGE : null;
}

const amountSchema = (message: string) =>
  z.string().transform((value, context) => {
    const amount = parseEuro(value);
    if (amount === null || amount < 0) {
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return amount;
  });

export const TRAVEL_SETTINGS_FIELDS = ["method", "kmRate", "tripFlat"] as const;

/** The general travel settings. Customers and jobs can override them later. */
export const travelSettingsSchema = z.object({
  method: z.enum(Constants.public.Enums.travel_method, {
    error: "Kies hoe je verplaatsingen aanrekent.",
  }),
  kmRate: amountSchema("Geef een bedrag per km in, bv. 0,43."),
  tripFlat: amountSchema("Geef een bedrag per rit in, bv. 25,00."),
});
