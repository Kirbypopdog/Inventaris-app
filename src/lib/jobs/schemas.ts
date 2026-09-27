import { z } from "zod";
import { postalCodeSchema } from "@/lib/contact-fields";
import { optionalText } from "@/lib/forms";
import {
  TRAVEL_OVERRIDE_FIELDS,
  optionalMarginSchema,
  travelOverrideRow,
  travelOverrideShape,
} from "@/lib/rates/overrides";
import { Constants } from "@/lib/supabase/database.types";
import { optionalVatRateSchema } from "@/lib/vat";

export const JOB_FIELDS = [
  "customerId",
  "title",
  "description",
  "addressLine",
  "postalCode",
  "city",
  "status",
  "startsOn",
  "endsOn",
  "hourlyRateId",
  ...TRAVEL_OVERRIDE_FIELDS,
  "materialMargin",
  "vatRate",
] as const;

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const optionalDate = z
  .string()
  .trim()
  .refine((value) => value === "" || (/^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value)), {
    error: "Geef een geldige datum in.",
  })
  .transform((value) => (value === "" ? null : value));

export const jobStatusSchema = z.enum(Constants.public.Enums.job_status, {
  error: "Kies een geldige status.",
});

export const jobSchema = z
  .object({
    customerId: z.uuid({ error: "Kies een klant." }),
    title: z
      .string()
      .trim()
      .min(1, { error: "Geef de job een naam, bv. 'Keuken Assebroek'." })
      .max(200, { error: "De naam is te lang." }),
    description: optionalText(5000, "De omschrijving is te lang (maximaal 5000 tekens)."),
    addressLine: optionalText(200, "Het adres is te lang."),
    postalCode: postalCodeSchema,
    city: optionalText(100, "De gemeente is te lang."),
    status: jobStatusSchema,
    startsOn: optionalDate,
    endsOn: optionalDate,
    // Empty: the default hourly rate.
    hourlyRateId: z
      .union([z.literal(""), z.uuid({ error: "Kies een geldig uurtarief." })])
      .transform((value) => (value === "" ? null : value)),
    ...travelOverrideShape,
    // Empty: the margin of the material, or else the general margin.
    materialMargin: optionalMarginSchema,
    // Empty: the general VAT rate.
    vatRate: optionalVatRateSchema,
  })
  .refine((job) => !job.startsOn || !job.endsOn || job.endsOn >= job.startsOn, {
    error: "De einddatum ligt vóór de startdatum.",
    path: ["endsOn"],
  });

export type JobInput = z.infer<typeof jobSchema>;

/** Maps validated input to the columns of public.jobs. */
export function jobRow(input: JobInput) {
  return {
    customer_id: input.customerId,
    title: input.title,
    description: input.description,
    address_line: input.addressLine,
    postal_code: input.postalCode,
    city: input.city,
    status: input.status,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    hourly_rate_id: input.hourlyRateId,
    ...travelOverrideRow(input),
    material_margin_bp: input.materialMargin,
    vat_rate: input.vatRate,
  };
}
