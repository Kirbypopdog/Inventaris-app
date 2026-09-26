"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireManager } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import { hourlyRateSchema } from "@/lib/rates/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();
const PATH = "/instellingen/uurtarieven";

export async function addHourlyRate(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireManager();
  const values = formValues(formData, ["name", "rate"]);
  const input = hourlyRateSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  // The first rate becomes the default, so clocking in works right away.
  const { count, error: countError } = await supabase
    .from("hourly_rates")
    .select("id", { count: "exact", head: true })
    .eq("is_default", true);
  if (countError) {
    return { status: "error", message: saveErrorMessage(countError), values };
  }

  const { error } = await supabase.from("hourly_rates").insert({
    name: input.data.name,
    rate_cents: input.data.rate,
    is_default: count === 0,
  });
  if (error) {
    console.error("Adding hourly rate failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(PATH);
  return { status: "success", message: `Uurtarief "${input.data.name}" toegevoegd.` };
}

export async function makeDefaultHourlyRate(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireManager();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekend uurtarief." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_default_hourly_rate", { rate_id: id.data });
  if (error) {
    console.error("set_default_hourly_rate failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath(PATH);
  return { status: "success", message: "Standaardtarief gewijzigd." };
}

/** Archived rates can no longer be chosen; hours already registered keep their rate. */
export async function setHourlyRateArchived(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireManager();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekend uurtarief." };
  }
  const archive = field(formData, "archive") === "true";
  const supabase = await createClient();
  const { error } = await supabase
    .from("hourly_rates")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id.data)
    .select("id")
    .single();
  if (error) {
    console.error("Archiving hourly rate failed", { code: error.code, message: error.message });
    return {
      status: "error",
      message:
        error.code === "23514"
          ? "Het standaardtarief kan je niet archiveren. Maak eerst een ander tarief standaard."
          : saveErrorMessage(error),
    };
  }
  revalidatePath(PATH);
  return { status: "success", message: archive ? "Gearchiveerd." : "Terug actief." };
}
