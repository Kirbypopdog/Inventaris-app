"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth/session";
import { memberErrorMessage } from "@/lib/members/errors";
import {
  memberIdSchema,
  memberUpdateSchema,
  newMemberSchema,
  passwordResetSchema,
} from "@/lib/members/schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { field, firstIssue, type FormState } from "@/lib/forms";

export async function addMember(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireManager();
  // Shown again after an error. The password is deliberately not sent back.
  const values = {
    email: field(formData, "email"),
    displayName: field(formData, "displayName"),
    role: field(formData, "role"),
  };
  const input = newMemberSchema.safeParse({
    ...values,
    temporaryPassword: field(formData, "temporaryPassword"),
  });
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  // Het account aanmaken kan enkel met de geheime sleutel. Bestaat het al (bv. een
  // vroeger verwijderd lid), dan gebruiken we dat account opnieuw.
  const admin = createAdminClient();
  const { error: createError } = await admin.auth.admin.createUser({
    email: input.data.email,
    password: input.data.temporaryPassword,
    email_confirm: true,
  });
  const accountExisted = createError?.code === "email_exists";
  if (createError && !accountExisted) {
    console.error("Creating auth user failed", {
      code: createError.code,
      status: createError.status,
    });
    return { status: "error", message: "Het account kon niet aangemaakt worden.", values };
  }

  // Lid maken met de sessie van de ingelogde gebruiker: de database controleert de
  // rechten en het logboek bewaart wie het deed.
  const supabase = await createClient();
  const { data: userId, error } = await supabase.rpc("add_member", {
    member_email: input.data.email,
    member_role: input.data.role,
    member_display_name: input.data.displayName,
  });
  if (error) {
    console.error("add_member failed", { code: error.code, message: error.message });
    return { status: "error", message: memberErrorMessage(error), values };
  }

  if (accountExisted) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
      password: input.data.temporaryPassword,
    });
    if (passwordError) {
      console.error("Setting temporary password failed", {
        code: passwordError.code,
        status: passwordError.status,
      });
      revalidatePath("/gebruikers");
      return {
        status: "error",
        message: `${input.data.displayName} is toegevoegd, maar het wachtwoord kon niet ingesteld worden. Gebruik "Nieuw tijdelijk wachtwoord".`,
      };
    }
  }

  revalidatePath("/gebruikers");
  return {
    status: "success",
    message: `${input.data.displayName} is toegevoegd. Geef het tijdelijke wachtwoord door; bij het aanmelden kiest ${input.data.displayName} een eigen wachtwoord.`,
  };
}

export async function resetPassword(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireManager();
  const input = passwordResetSchema.safeParse({
    userId: field(formData, "userId"),
    temporaryPassword: field(formData, "temporaryPassword"),
  });
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error) };
  }

  // Eerst de database: controleert de rechten en zet "moet wachtwoord wijzigen" aan.
  const supabase = await createClient();
  const { error } = await supabase.rpc("require_password_change", {
    target_user_id: input.data.userId,
  });
  if (error) {
    console.error("require_password_change failed", { code: error.code, message: error.message });
    return { status: "error", message: memberErrorMessage(error) };
  }

  const { error: passwordError } = await createAdminClient().auth.admin.updateUserById(
    input.data.userId,
    { password: input.data.temporaryPassword },
  );
  if (passwordError) {
    console.error("Setting temporary password failed", {
      code: passwordError.code,
      status: passwordError.status,
    });
    return { status: "error", message: "Het wachtwoord kon niet ingesteld worden." };
  }

  revalidatePath("/gebruikers");
  return {
    status: "success",
    message:
      "Nieuw tijdelijk wachtwoord ingesteld. Bij het aanmelden kiest deze persoon een eigen wachtwoord.",
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
