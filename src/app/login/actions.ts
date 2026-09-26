"use server";

import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/errors";
import { codeSchema, emailSchema } from "@/lib/auth/schemas";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { step: "email"; email: string; error?: string }
  | { step: "code"; email: string; error?: string };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Two-step login: send a code to the e-mail address, then verify that code. */
export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const intent = field(formData, "intent");
  const rawEmail = field(formData, "email");

  if (intent === "restart") {
    return { step: "email", email: rawEmail };
  }

  const email = emailSchema.safeParse(rawEmail);
  if (!email.success) {
    return { step: "email", email: rawEmail, error: email.error.issues[0]?.message };
  }

  const supabase = await createClient();

  if (intent === "request") {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.data,
      // Zelf registreren staat uit: enkel bestaande gebruikers krijgen een code.
      options: { shouldCreateUser: false },
    });
    if (error) {
      console.error("Requesting login code failed", { code: error.code, status: error.status });
      return { step: "email", email: email.data, error: authErrorMessage(error) };
    }
    return { step: "code", email: email.data };
  }

  if (intent === "verify") {
    const code = codeSchema.safeParse(field(formData, "code"));
    if (!code.success) {
      return { step: "code", email: email.data, error: code.error.issues[0]?.message };
    }
    const { error } = await supabase.auth.verifyOtp({
      email: email.data,
      token: code.data,
      type: "email",
    });
    if (error) {
      console.error("Verifying login code failed", { code: error.code, status: error.status });
      return { step: "code", email: email.data, error: authErrorMessage(error) };
    }
    redirect("/");
  }

  console.error("Unknown login intent", { intent });
  return { step: "email", email: email.data, error: authErrorMessage({}) };
}
