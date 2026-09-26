"use server";

import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/errors";
import { passwordChangeSchema } from "@/lib/auth/schemas";
import { requireSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type PasswordState = { error?: string };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function changePassword(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const session = await requireSession({ allowTemporaryPassword: true });
  if (session.status !== "member") {
    return { error: "Dit account heeft geen toegang." };
  }

  const input = passwordChangeSchema.safeParse({
    password: field(formData, "password"),
    confirmation: field(formData, "confirmation"),
  });
  if (!input.success) {
    return { error: input.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.data.password });
  if (error) {
    console.error("Changing password failed", { code: error.code, status: error.status });
    return { error: authErrorMessage(error) };
  }

  const { error: markError } = await supabase.rpc("mark_password_changed");
  if (markError) {
    // The password itself is changed; only the flag failed. Showing an error lets the
    // user retry, which is harmless.
    console.error("mark_password_changed failed", {
      code: markError.code,
      message: markError.message,
    });
    return {
      error: "Je wachtwoord is gewijzigd, maar er ging iets mis bij het opslaan. Probeer opnieuw.",
    };
  }

  redirect("/");
}
