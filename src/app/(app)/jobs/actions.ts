"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import { JOB_FIELDS, jobRow, jobSchema, jobStatusSchema } from "@/lib/jobs/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

function revalidateJob(id: string, customerId: string) {
  revalidatePath("/");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath(`/klanten/${customerId}`);
}

/** Creates a job (no id) or updates one (with id). */
export async function saveJob(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, JOB_FIELDS);
  const input = jobSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const rawId = field(formData, "id");

  if (!rawId) {
    const { data, error } = await supabase
      .from("jobs")
      .insert(jobRow(input.data))
      .select("id")
      .single();
    if (error) {
      console.error("Creating job failed", { code: error.code, message: error.message });
      return { status: "error", message: saveErrorMessage(error), values };
    }
    revalidateJob(data.id, input.data.customerId);
    redirect(`/jobs/${data.id}`);
  }

  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return { status: "error", message: "Onbekende job.", values };
  }
  const { error } = await supabase
    .from("jobs")
    .update(jobRow(input.data))
    .eq("id", id.data)
    .select("id")
    .single();
  if (error) {
    console.error("Updating job failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidateJob(id.data, input.data.customerId);
  return { status: "success", message: "Job opgeslagen." };
}

export async function setJobStatus(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  const status = jobStatusSchema.safeParse(field(formData, "status"));
  if (!id.success || !status.success) {
    return { status: "error", message: "Onbekende job of status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .update({ status: status.data })
    .eq("id", id.data)
    .select("customer_id")
    .single();
  if (error) {
    console.error("Changing job status failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateJob(id.data, data.customer_id);
  return { status: "success", message: "Status gewijzigd." };
}
