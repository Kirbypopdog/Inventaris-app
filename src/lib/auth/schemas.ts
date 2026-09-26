import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Geef een geldig e-mailadres in." }));

// Supabase stuurt standaard 6 cijfers, maar het aantal is instelbaar (6 tot 10).
export const codeSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6,10}$/, { error: "De code bestaat uit cijfers, bv. 123456." }));
