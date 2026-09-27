"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import {
  NOTE_FIELDS,
  NOTE_UPDATE_FIELDS,
  TASK_FIELDS,
  noteSchema,
  noteUpdateSchema,
  taskDoneSchema,
  taskSchema,
} from "@/lib/notes/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

export async function addNote(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, NOTE_FIELDS);
  const input = noteSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_notes")
    .insert({ job_id: input.data.jobId, body: input.data.body });
  if (error) {
    console.error("Adding note failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(`/jobs/${input.data.jobId}`);
  return { status: "success", message: "Notitie bewaard." };
}

export async function updateNote(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, NOTE_UPDATE_FIELDS);
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende notitie.", values };
  }
  const input = noteUpdateSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_notes")
    .update({ body: input.data.body })
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Updating note failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(`/jobs/${data.job_id}`);
  return { status: "success", message: "Notitie aangepast." };
}

export async function deleteNote(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende notitie." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_notes")
    .delete()
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Deleting note failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath(`/jobs/${data.job_id}`);
  return { status: "success", message: "Verwijderd." };
}

export async function addTask(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, TASK_FIELDS);
  const input = taskSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("job_tasks")
    .insert({ job_id: input.data.jobId, title: input.data.title });
  if (error) {
    console.error("Adding task failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(`/jobs/${input.data.jobId}`);
  return { status: "success", message: "Taak toegevoegd." };
}

/** Ticks a task off or opens it again. Called straight from the checkbox, not from a form. */
export async function setTaskDone(id: string, done: boolean): Promise<FormState> {
  await requireMember();
  const input = taskDoneSchema.safeParse({ id, done });
  if (!input.success) {
    return { status: "error", message: "Onbekende taak." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_tasks")
    .update({ done_at: input.data.done ? new Date().toISOString() : null })
    .eq("id", input.data.id)
    .select("job_id")
    .single();
  if (error) {
    console.error("Updating task failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath(`/jobs/${data.job_id}`);
  return { status: "success", message: input.data.done ? "Afgevinkt." : "Terug open." };
}

/** Clears the ticked-off tasks of a job, so the list stays short. */
export async function clearDoneTasks(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const jobId = idSchema.safeParse(field(formData, "jobId"));
  if (!jobId.success) {
    return { status: "error", message: "Onbekende job." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("job_tasks")
    .delete()
    .eq("job_id", jobId.data)
    .not("done_at", "is", null);
  if (error) {
    console.error("Clearing done tasks failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath(`/jobs/${jobId.data}`);
  return { status: "success", message: "Afgewerkte taken gewist." };
}
