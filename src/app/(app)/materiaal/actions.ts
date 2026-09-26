"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import { MATERIAL_FIELDS, materialRow, materialSchema } from "@/lib/materials/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

/** Creates a material (no id) or updates one (with id). Jobs keep the price they were given. */
export async function saveMaterial(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, MATERIAL_FIELDS);
  const input = materialSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const rawId = field(formData, "id");

  if (!rawId) {
    const { data, error } = await supabase
      .from("materials")
      .insert(materialRow(input.data))
      .select("id")
      .single();
    if (error) {
      console.error("Creating material failed", { code: error.code, message: error.message });
      return { status: "error", message: saveErrorMessage(error), values };
    }
    revalidatePath("/materiaal");
    redirect(`/materiaal/${data.id}`);
  }

  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return { status: "error", message: "Onbekend materiaal.", values };
  }
  const { error } = await supabase
    .from("materials")
    .update(materialRow(input.data))
    .eq("id", id.data)
    .select("id")
    .single();
  if (error) {
    console.error("Updating material failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath("/materiaal");
  revalidatePath(`/materiaal/${id.data}`);
  return {
    status: "success",
    message: "Materiaal opgeslagen. Materiaal dat al op een job staat, houdt de oude prijs.",
  };
}

/** Archiving hides a material from the catalogue; jobs that used it keep it. */
export async function setMaterialArchived(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekend materiaal." };
  }
  const archive = field(formData, "archive") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("materials")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id.data)
    .select("id")
    .single();
  if (error) {
    console.error("Archiving material failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath("/materiaal");
  revalidatePath(`/materiaal/${id.data}`);
  return {
    status: "success",
    message: archive
      ? "Materiaal gearchiveerd. Het staat niet meer in de lijst, maar jobs die het gebruikten houden het."
      : "Materiaal staat weer in de lijst.",
  };
}
