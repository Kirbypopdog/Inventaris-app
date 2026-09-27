import { z } from "zod";
import { optionalText } from "@/lib/forms";

/** Larger than 100 m is almost certainly a typing error. */
const MAX_MM = 100_000;

const MM_MESSAGE = "Geef de maat in hele millimeter, bv. 1200.";

/**
 * A size in whole millimetre; spaces between the digits are fine. Dots and commas are refused:
 * "12.5" could be meant as a decimal. Empty is null.
 */
const mmSchema = z.string().transform((value, context) => {
  const cleaned = value.replace(/\s/g, "");
  if (cleaned === "") {
    return null;
  }
  if (!/^\d+$/.test(cleaned) || Number(cleaned) < 1 || Number(cleaned) > MAX_MM) {
    context.addIssue({ code: "custom", message: MM_MESSAGE });
    return z.NEVER;
  }
  return Number(cleaned);
});

export const MEASUREMENT_FIELDS = ["jobId", "label", "width", "height", "depth", "note"] as const;

/** A measurement on site: what was measured and at least one size, like the database requires. */
export const measurementSchema = z
  .object({
    jobId: z.uuid({ error: "Onbekende job." }),
    label: z
      .string()
      .trim()
      .min(1, { error: "Schrijf wat je opgemeten hebt, bv. Kast hal." })
      .max(200, { error: "De omschrijving is te lang (maximaal 200 tekens)." }),
    width: mmSchema,
    height: mmSchema,
    depth: mmSchema,
    note: optionalText(1000, "De notitie is te lang (maximaal 1000 tekens)."),
  })
  .refine((input) => input.width !== null || input.height !== null || input.depth !== null, {
    error: "Vul minstens één maat in.",
  });

export type MeasurementInput = z.infer<typeof measurementSchema>;

/** Maps validated input to the columns of public.job_measurements. */
export function measurementRow(input: MeasurementInput) {
  return {
    label: input.label,
    width_mm: input.width,
    height_mm: input.height,
    depth_mm: input.depth,
    note: input.note,
  };
}
