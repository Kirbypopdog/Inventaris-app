"use server";

import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/errors";
import { emailSchema, loginPasswordSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { email: string; error?: string };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = field(formData, "email");
  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) {
    return { email: rawEmail, error: email.error.issues[0]?.message };
  }
  const password = loginPasswordSchema.safeParse(field(formData, "password"));
  if (!password.success) {
    return { email: email.data, error: password.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });
  if (error) {
    // Wrong credentials are expected; everything else is worth a look.
    if (error.code !== "invalid_credentials") {
      console.error("Login failed", { code: error.code, status: error.status });
    }
    return { email: email.data, error: authErrorMessage(error) };
  }

  redirect("/");
}
