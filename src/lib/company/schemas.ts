import { z } from "zod";
import { emailSchema, postalCodeSchema, vatNumberSchema } from "@/lib/contact-fields";
import { optionalText } from "@/lib/forms";
import { isValidIban, normalizeIban } from "@/lib/iban";
import { vatRateSchema } from "@/lib/vat";

export const COMPANY_FIELDS = [
  "companyName",
  "vatNumber",
  "addressLine",
  "postalCode",
  "city",
  "email",
  "phone",
  "iban",
  "quoteValidityDays",
  "vatRate",
  "budgetWarningPercent",
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
  quoteValidityDays: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, { error: "Geef het aantal dagen dat een offerte geldig is, bv. 30." })
    .transform(Number)
    .refine((days) => days >= 1 && days <= 365, {
      error: "Een offerte is 1 tot 365 dagen geldig.",
    }),
  vatRate: vatRateSchema,
  budgetWarningPercent: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/, { error: "Geef een percentage in voor de budgetwaarschuwing, bv. 80." })
    .transform(Number)
    .refine((percent) => percent >= 1 && percent <= 100, {
      error: "De budgetwaarschuwing ligt tussen 1 en 100%.",
    }),
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
    quote_validity_days: input.quoteValidityDays,
    vat_rate: input.vatRate,
    budget_warning_percent: input.budgetWarningPercent,
  };
}
