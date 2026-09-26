import "server-only";
import { z } from "zod";
import { parseEnv } from "./env";

const serverEnvSchema = z.object({
  // Volledige toegang tot Supabase. Enkel op de server, nooit met NEXT_PUBLIC_.
  SUPABASE_SECRET_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  return parseEnv(serverEnvSchema, { SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY });
}
