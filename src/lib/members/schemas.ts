import { z } from "zod";
import { emailSchema, newPasswordSchema } from "@/lib/auth/schemas";
import { APP_ROLES } from "@/lib/auth/roles";

const displayNameSchema = z
  .string()
  .trim()
  .min(1, { error: "Geef een naam in." })
  .max(100, { error: "De naam is te lang (maximaal 100 tekens)." });

const roleSchema = z.enum(APP_ROLES, { error: "Kies een rol." });

export const newMemberSchema = z.object({
  email: emailSchema,
  displayName: displayNameSchema,
  role: roleSchema,
  temporaryPassword: newPasswordSchema,
});

export const memberUpdateSchema = z.object({
  userId: z.uuid({ error: "Onbekend lid." }),
  displayName: displayNameSchema,
  role: roleSchema,
});

export const memberIdSchema = z.uuid({ error: "Onbekend lid." });

export const passwordResetSchema = z.object({
  userId: z.uuid({ error: "Onbekend lid." }),
  temporaryPassword: newPasswordSchema,
});
