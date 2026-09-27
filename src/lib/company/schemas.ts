import { z } from "zod";
import { emailSchema, postalCodeSchema, vatNumberSchema } from "@/lib/contact-fields";
import { optionalText } from "@/lib/forms";
import { isValidIban, normalizeIban } from "@/lib/iban";

export const COMPANY_FIELDS = [
  "companyName",
  "vatNumber",
  "addressLine",
  "postalCode",
  "city",
  "email",
  "phone",
  "iban",
] as const;

const ibanSchema = z
  .string()
  .transform(normalizeIban)
  .refine((value) => value === "" || isValidIban(value), {
    error: "Dit rekeningnummer klopt niet. Controleer de cijfers (bv. BE68 5390 0754 7034).",
  })
  .transform((value) => (value === "" ? null : value));

/**
 * The company's own details, printed on quotes and invoices. Fields may stay empty for
 * now; what an invoice needs is checked when the invoice is made final.
 */
export const companySchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, { error: "Geef de naam van het bedrijf in." })
    .max(200, { error: "De naam is te lang." }),
  vatNumber: vatNumberSchema,
  addressLine: optionalText(200, "Het adres is te lang."),
  postalCode: postalCodeSchema,
  city: optionalText(100, "De gemeente is te lang."),
  email: emailSchema,
  phone: optionalText(50, "Het telefoonnummer is te lang."),
  iban: ibanSchema,
});

export type CompanyInput = z.infer<typeof companySchema>;

/** Maps validated input to the columns of public.settings. */
export function companyRow(input: CompanyInput) {
  return {
    company_name: input.companyName,
    vat_number: input.vatNumber,
    address_line: input.addressLine,
    postal_code: input.postalCode,
    city: input.city,
    email: input.email,
    phone: input.phone,
    iban: input.iban,
  };
}
