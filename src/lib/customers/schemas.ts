import { z } from "zod";
import { emailSchema, postalCodeSchema, vatNumberSchema } from "@/lib/contact-fields";
import { optionalText } from "@/lib/forms";
import {
  TRAVEL_OVERRIDE_FIELDS,
  travelOverrideRow,
  travelOverrideShape,
} from "@/lib/rates/overrides";
import { Constants } from "@/lib/supabase/database.types";

export const CUSTOMER_FIELDS = [
  "type",
  "name",
  "vatNumber",
  "email",
  "phone",
  "addressLine",
  "postalCode",
  "city",
  "notes",
  ...TRAVEL_OVERRIDE_FIELDS,
] as const;

export const customerSchema = z.object({
  type: z.enum(Constants.public.Enums.customer_type, { error: "Kies particulier of bedrijf." }),
  name: z
    .string()
    .trim()
    .min(1, { error: "Geef een naam in." })
    .max(200, { error: "De naam is te lang." }),
  vatNumber: vatNumberSchema,
  email: emailSchema,
  phone: optionalText(50, "Het telefoonnummer is te lang."),
  addressLine: optionalText(200, "Het adres is te lang."),
  postalCode: postalCodeSchema,
  city: optionalText(100, "De gemeente is te lang."),
  notes: optionalText(2000, "De notities zijn te lang (maximaal 2000 tekens)."),
  ...travelOverrideShape,
});

export type CustomerInput = z.infer<typeof customerSchema>;

/** Maps validated input to the columns of public.customers. */
export function customerRow(input: CustomerInput) {
  return {
    type: input.type,
    name: input.name,
    vat_number: input.vatNumber,
    email: input.email,
    phone: input.phone,
    address_line: input.addressLine,
    postal_code: input.postalCode,
    city: input.city,
    notes: input.notes,
    ...travelOverrideRow(input),
  };
}
