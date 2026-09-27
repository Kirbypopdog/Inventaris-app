"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import { MEASUREMENT_FIELDS, measurementRow, measurementSchema } from "@/lib/measurements/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

export async function addMeasurement(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, MEASUREMENT_FIELDS);
  const input = measurementSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_measurements")
    .insert({ job_id: input.data.jobId, ...measurementRow(input.data) });
  if (error) {
    console.error("Adding measurement failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(`/jobs/${input.data.jobId}`);
  return { status: "success", message: "Opmeting bewaard." };
}

export async function updateMeasurement(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, MEASUREMENT_FIELDS);
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende opmeting.", values };
  }
  const input = measurementSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_measurements")
    .update(measurementRow(input.data))
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Updating measurement failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(`/jobs/${data.job_id}`);
  return { status: "success", message: "Opmeting aangepast." };
}

export async function deleteMeasurement(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende opmeting." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_measurements")
    .delete()
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Deleting measurement failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath(`/jobs/${data.job_id}`);
  return { status: "success", message: "Verwijderd." };
}
