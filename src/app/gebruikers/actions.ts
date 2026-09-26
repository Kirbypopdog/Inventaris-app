"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth/session";
import { memberErrorMessage } from "@/lib/members/errors";
import { memberIdSchema, memberUpdateSchema, newMemberSchema } from "@/lib/members/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  // values: what was filled in, so the form can show it again after an error.
  | { status: "error"; message: string; values?: Record<string, string> };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Controleer de ingevulde gegevens.";
}

export async function addMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireManager();
  const input = newMemberSchema.safeParse({
    email: field(formData, "email"),
    displayName: field(formData, "displayName"),
    role: field(formData, "role"),
  });
  const values = {
    email: field(formData, "email"),
    displayName: field(formData, "displayName"),
    role: field(formData, "role"),
  };
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  // Het account aanmaken kan enkel met de geheime sleutel. Bestaat het al (bv. een
  // vroeger verwijderd lid), dan gebruiken we dat account opnieuw.
  const { error: createError } = await createAdminClient().auth.admin.createUser({
    email: input.data.email,
    email_confirm: true,
  });
  if (createError && createError.code !== "email_exists") {
    console.error("Creating auth user failed", {
      code: createError.code,
      status: createError.status,
    });
    return { status: "error", message: "Het account kon niet aangemaakt worden.", values };
  }

  // Lid maken met de sessie van de ingelogde gebruiker: de database controleert de
  // rechten en het logboek bewaart wie het deed.
  const supabase = await createClient();
  const { error } = await supabase.rpc("add_member", {
    member_email: input.data.email,
    member_role: input.data.role,
    member_display_name: input.data.displayName,
  });
  if (error) {
    console.error("add_member failed", { code: error.code, message: error.message });
    return { status: "error", message: memberErrorMessage(error), values };
  }

  revalidatePath("/gebruikers");
  return {
    status: "success",
    message: `${input.data.displayName} is toegevoegd en kan aanmelden met ${input.data.email}.`,
  };
}

export async function updateMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireManager();
  const input = memberUpdateSchema.safeParse({
    userId: field(formData, "userId"),
    displayName: field(formData, "displayName"),
    role: field(formData, "role"),
  });
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_member", {
    target_user_id: input.data.userId,
    member_role: input.data.role,
    member_display_name: input.data.displayName,
  });
  if (error) {
    console.error("update_member failed", { code: error.code, message: error.message });
    return { status: "error", message: memberErrorMessage(error) };
  }

  revalidatePath("/gebruikers");
  return { status: "success", message: "Opgeslagen." };
}

export async function removeMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireManager();
  const userId = memberIdSchema.safeParse(field(formData, "userId"));
  if (!userId.success) {
    return { status: "error", message: firstIssue(userId.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { target_user_id: userId.data });
  if (error) {
    console.error("remove_member failed", { code: error.code, message: error.message });
    return { status: "error", message: memberErrorMessage(error) };
  }

  revalidatePath("/gebruikers");
  return { status: "success", message: "Verwijderd. Deze persoon heeft geen toegang meer." };
}
