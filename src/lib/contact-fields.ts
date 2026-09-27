import { z } from "zod";
import { isValidVatNumber, normalizeVatNumber } from "@/lib/belgium";

/** Contact fields shared by customers and the company's own details. Empty becomes null. */

export const vatNumberSchema = z
  .string()
  .transform(normalizeVatNumber)
  .refine((value) => value === "" || isValidVatNumber(value), {
    error: "Dit btw-nummer klopt niet. Controleer de cijfers (bv. BE 0123.456.749).",
  })
  .transform((value) => (value === "" ? null : value));

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => value === "" || z.email().safeParse(value).success, {
    error: "Geef een geldig e-mailadres in, of laat het leeg.",
  })
  .transform((value) => (value === "" ? null : value));

export const postalCodeSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}$/.test(value), {
    error: "Een Belgische postcode heeft 4 cijfers.",
  })
  .transform((value) => (value === "" ? null : value));
