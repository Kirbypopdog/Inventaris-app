"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { firstIssue, formValues, type FormState } from "@/lib/forms";
import { generalMarginSchema } from "@/lib/rates/overrides";
import { createClient } from "@/lib/supabase/server";

/** Saves the general margin on material. Material already on a job keeps its margin. */
export async function saveGeneralMargin(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireManager();
  const values = formValues(formData, ["margin"]);
  const input = generalMarginSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  // There is exactly one settings row (see the core schema).
  const { error } = await supabase
    .from("settings")
    .update({ material_margin_bp: input.data.margin })
    .eq("singleton", true)
    .select("id")
    .single();
  if (error) {
    console.error("Saving margin failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath("/instellingen/marge");
  return {
    status: "success",
    message: "Opgeslagen. Materiaal dat al op een job staat, houdt zijn marge.",
  };
}
