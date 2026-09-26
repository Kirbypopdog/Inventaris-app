"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { firstIssue, formValues, type FormState } from "@/lib/forms";
import { TRAVEL_SETTINGS_FIELDS, travelSettingsSchema } from "@/lib/trips/schemas";
import { createClient } from "@/lib/supabase/server";

/** Saves the general travel settings. Trips that were already added keep their rate. */
export async function saveTravelSettings(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireManager();
  const values = formValues(formData, TRAVEL_SETTINGS_FIELDS);
  const input = travelSettingsSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  // There is exactly one settings row (see the core schema).
  const { error } = await supabase
    .from("settings")
    .update({
      travel_method: input.data.method,
      km_rate_cents: input.data.kmRate,
      trip_flat_cents: input.data.tripFlat,
    })
    .eq("singleton", true)
    .select("id")
    .single();
  if (error) {
    console.error("Saving travel settings failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath("/instellingen/verplaatsingen");
  revalidatePath("/jobs", "layout");
  return { status: "success", message: "Opgeslagen. Ritten die al bestaan, houden hun tarief." };
}
