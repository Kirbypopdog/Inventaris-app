"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // The local session is removed anyway; the proxy sends the user back if it is still valid.
    console.error("Sign out failed", { code: error.code, status: error.status });
  }
  redirect("/login");
}
