"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/auth/session";
import { COMPANY_FIELDS, companyRow, companySchema } from "@/lib/company/schemas";
import { saveErrorMessage } from "@/lib/database-errors";
import { firstIssue, formValues, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

/** Saves the company's own details, used on quotes and invoices. */
export async function saveCompany(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireManager();
  const values = formValues(formData, COMPANY_FIELDS);
  const input = companySchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  // There is exactly one settings row (see the core schema).
  const { error } = await supabase
    .from("settings")
    .update(companyRow(input.data))
    .eq("singleton", true)
    .select("id")
    .single();
  if (error) {
    console.error("Saving company details failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath("/instellingen/bedrijf");
  return { status: "success", message: "Bedrijfsgegevens opgeslagen." };
}
