"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { jobTabHref } from "@/lib/jobs/tabs";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import {
  QUOTE_DETAILS_FIELDS,
  QUOTE_LINE_FIELDS,
  quoteDetailsRow,
  quoteDetailsSchema,
  quoteLineRow,
  quoteLineSchema,
} from "@/lib/quotes/schemas";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";

const idSchema = z.uuid();
const statusSchema = z.enum(Constants.public.Enums.quote_status);

function revalidateQuote(quoteId: string, jobId: string) {
  revalidatePath("/offertes");
  revalidatePath(`/offertes/${quoteId}`);
  revalidatePath(`/jobs/${jobId}`);
}

/** Starts a new quote (draft) for a job, with the next number, and opens it. */
export async function createQuote(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const jobId = idSchema.safeParse(field(formData, "jobId"));
  if (!jobId.success) {
    return { status: "error", message: "Onbekende job." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_quote", { target_job_id: jobId.data });
  if (error) {
    console.error("create_quote failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateQuote(data.id, jobId.data);
  redirect(`/offertes/${data.id}`);
}

export async function saveQuoteDetails(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, QUOTE_DETAILS_FIELDS);
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende offerte.", values };
  }
  const input = quoteDetailsSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .update(quoteDetailsRow(input.data))
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Updating quote failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidateQuote(id.data, data.job_id);
  return { status: "success", message: "Opgeslagen." };
}

export async function setQuoteStatus(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  const status = statusSchema.safeParse(field(formData, "status"));
  if (!id.success || !status.success) {
    return { status: "error", message: "Onbekende offerte of status." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .update({ status: status.data })
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Updating quote status failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateQuote(id.data, data.job_id);
  return { status: "success", message: "Status aangepast." };
}

/** Deletes a draft quote with its lines; the database refuses other statuses. */
export async function deleteQuote(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende offerte." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Deleting quote failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateQuote(id.data, data.job_id);
  redirect(jobTabHref(data.job_id, "offertes"));
}

/** Adds a line (no id) or updates one (with id). */
export async function saveQuoteLine(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, QUOTE_LINE_FIELDS);
  const quoteId = idSchema.safeParse(field(formData, "quoteId"));
  if (!quoteId.success) {
    return { status: "error", message: "Onbekende offerte.", values };
  }
  const input = quoteLineSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const rawId = field(formData, "id");
  if (rawId) {
    const id = idSchema.safeParse(rawId);
    if (!id.success) {
      return { status: "error", message: "Onbekende regel.", values };
    }
    const { error } = await supabase
      .from("quote_lines")
      .update(quoteLineRow(input.data))
      .eq("id", id.data)
      .select("id")
      .single();
    if (error) {
      console.error("Updating quote line failed", { code: error.code, message: error.message });
      return { status: "error", message: saveErrorMessage(error), values };
    }
  } else {
    const { error } = await supabase
      .from("quote_lines")
      .insert({ quote_id: quoteId.data, ...quoteLineRow(input.data) });
    if (error) {
      console.error("Adding quote line failed", { code: error.code, message: error.message });
      return { status: "error", message: saveErrorMessage(error), values };
    }
  }
  revalidatePath(`/offertes/${quoteId.data}`);
  revalidatePath("/offertes");
  return { status: "success", message: rawId ? "Regel aangepast." : "Regel toegevoegd." };
}

export async function deleteQuoteLine(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende regel." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quote_lines")
    .delete()
    .eq("id", id.data)
    .select("quote_id")
    .single();
  if (error) {
    console.error("Deleting quote line failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath(`/offertes/${data.quote_id}`);
  revalidatePath("/offertes");
  return { status: "success", message: "Regel verwijderd." };
}
