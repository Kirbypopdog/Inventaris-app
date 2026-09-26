"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { CUSTOMER_FIELDS, customerRow, customerSchema } from "@/lib/customers/schemas";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

/** Creates a customer (no id) or updates one (with id). */
export async function saveCustomer(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, CUSTOMER_FIELDS);
  const input = customerSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const rawId = field(formData, "id");

  if (!rawId) {
    const { data, error } = await supabase
      .from("customers")
      .insert(customerRow(input.data))
      .select("id")
      .single();
    if (error) {
      console.error("Creating customer failed", { code: error.code, message: error.message });
      return { status: "error", message: saveErrorMessage(error), values };
    }
    revalidatePath("/klanten");
    redirect(`/klanten/${data.id}`);
  }

  const id = idSchema.safeParse(rawId);
  if (!id.success) {
    return { status: "error", message: "Onbekende klant.", values };
  }
  const { error } = await supabase
    .from("customers")
    .update(customerRow(input.data))
    .eq("id", id.data)
    .select("id")
    .single();
  if (error) {
    console.error("Updating customer failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath("/klanten");
  revalidatePath(`/klanten/${id.data}`);
  return { status: "success", message: "Klant opgeslagen." };
}

/** Archiving hides a customer from lists, but keeps their jobs and history. */
export async function setCustomerArchived(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende klant." };
  }
  const archive = field(formData, "archive") === "true";

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id.data)
    .select("id")
    .single();
  if (error) {
    console.error("Archiving customer failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath("/klanten");
  revalidatePath(`/klanten/${id.data}`);
  return {
    status: "success",
    message: archive
      ? "Klant gearchiveerd. De klant staat niet meer in de lijst, maar alle jobs blijven bewaard."
      : "Klant staat weer in de lijst.",
  };
}
