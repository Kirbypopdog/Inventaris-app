"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import { TIME_ENTRY_FIELDS, timeEntrySchema } from "@/lib/hours/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

function revalidateHours(jobIds: readonly string[]) {
  revalidatePath("/");
  for (const jobId of jobIds) {
    revalidatePath(`/jobs/${jobId}`);
  }
}

/** Clocks in on a job; a running clock on another job is stopped first. */
export async function clockIn(_previous: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  const jobId = idSchema.safeParse(field(formData, "jobId"));
  if (!jobId.success) {
    return { status: "error", message: "Onbekende job." };
  }

  const supabase = await createClient();
  const { data: running } = await supabase
    .from("time_entries")
    .select("job_id")
    .eq("user_id", member.userId)
    .is("ended_at", null)
    .maybeSingle();
  const { error } = await supabase.rpc("clock_in", { target_job_id: jobId.data });
  if (error) {
    console.error("clock_in failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateHours(running ? [jobId.data, running.job_id] : [jobId.data]);
  revalidatePath("/jobs");
  return { status: "success", message: "Ingeklokt." };
}

export async function clockOut(_previous: FormState, _formData: FormData): Promise<FormState> {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("clock_out");
  if (error) {
    console.error("clock_out failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateHours([data.job_id]);
  return { status: "success", message: "Uitgeklokt." };
}

/** Adds hours by hand (no id) or corrects an entry (with id). */
export async function saveTimeEntry(_previous: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  const values = formValues(formData, TIME_ENTRY_FIELDS);
  const input = timeEntrySchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const rawId = field(formData, "id");

  if (!rawId) {
    // A manual entry gets the job's rate, or else the default rate, like clocking in.
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("hourly_rate_id")
      .eq("id", input.data.jobId)
      .single();
    if (jobError) {
      return { status: "error", message: saveErrorMessage(jobError), values };
    }
    let rateQuery = supabase.from("hourly_rates").select("id, rate_cents");
    rateQuery = job.hourly_rate_id
      ? rateQuery.eq("id", job.hourly_rate_id)
      : rateQuery.eq("is_default", true).is("archived_at", null);
    const { data: rate, error: rateError } = await rateQuery.maybeSingle();
    if (rateError) {
      return { status: "error", message: saveErrorMessage(rateError), values };
    }
    if (!rate) {
      return { status: "error", message: saveErrorMessage({ code: "TS001" }), values };
    }

    const { error } = await supabase.from("time_entries").insert({
      job_id: input.data.jobId,
      user_id: member.userId,
      hourly_rate_id: rate.id,
      hourly_rate_cents: rate.rate_cents,
      started_at: input.data.startedAt,
      ended_at: input.data.endedAt,
      note: input.data.note,
    });
    if (error) {
      console.error("Adding time entry failed", { code: error.code, message: error.message });
      return { status: "error", message: saveErrorMessage(error), values };
    }
    revalidateHours([input.data.jobId]);
    return { status: "success", message: "Uren toegevoegd." };
  }

  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return { status: "error", message: "Onbekende registratie.", values };
  }
  const { error } = await supabase
    .from("time_entries")
    .update({
      started_at: input.data.startedAt,
      ended_at: input.data.endedAt,
      note: input.data.note,
    })
    .eq("id", id.data)
    .select("id")
    .single();
  if (error) {
    console.error("Updating time entry failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidateHours([input.data.jobId]);
  return { status: "success", message: "Uren aangepast." };
}

export async function deleteTimeEntry(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende registratie." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Deleting time entry failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateHours([data.job_id]);
  return { status: "success", message: "Verwijderd." };
}
