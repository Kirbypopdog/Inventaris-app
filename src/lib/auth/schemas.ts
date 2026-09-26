import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Geef een geldig e-mailadres in." }));

/** Password typed at login: only check that something was filled in. */
export const loginPasswordSchema = z.string().min(1, { error: "Geef je wachtwoord in." });

export const MIN_PASSWORD_LENGTH = 10;

/** A new password, chosen by the user or given as a temporary password by a manager. */
export const newPasswordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, {
    error: `Het wachtwoord moet minstens ${MIN_PASSWORD_LENGTH} tekens lang zijn.`,
  })
  // Supabase (bcrypt) gebruikt maximaal 72 bytes.
  .refine((value) => new TextEncoder().encode(value).length <= 72, {
    error: "Het wachtwoord is te lang.",
  });

export const passwordChangeSchema = z
  .object({ password: newPasswordSchema, confirmation: z.string() })
  .refine((value) => value.password === value.confirmation, {
    error: "De twee wachtwoorden zijn niet gelijk.",
    path: ["confirmation"],
  });
