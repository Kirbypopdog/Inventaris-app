"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { firstIssue, formValues, type FormState } from "@/lib/forms";
import {
  ORDER_ITEM_FIELDS,
  orderItemRow,
  orderItemSchema,
  orderedSchema,
} from "@/lib/orders/schemas";
import { createClient } from "@/lib/supabase/server";

/** The order list and the job it is for show the item. */
function revalidateOrders(jobId: string | null): void {
  revalidatePath("/bestellijst");
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
  }
}

export async function addOrderItem(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, ORDER_ITEM_FIELDS);
  const input = orderItemSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("order_items").insert(orderItemRow(input.data));
  if (error) {
    console.error("Adding order item failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidateOrders(input.data.jobId);
  return { status: "success", message: `${input.data.description} staat op de bestellijst.` };
}

/** Ticks an item off as ordered or opens it again. Called straight from the checkbox. */
export async function setOrdered(id: string, ordered: boolean): Promise<FormState> {
  await requireMember();
  const input = orderedSchema.safeParse({ id, ordered });
  if (!input.success) {
    return { status: "error", message: "Onbekende regel op de bestellijst." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .update({ ordered_at: input.data.ordered ? new Date().toISOString() : null })
    .eq("id", input.data.id)
    .select("job_id")
    .single();
  if (error) {
    console.error("Updating order item failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateOrders(data.job_id);
  return { status: "success", message: input.data.ordered ? "Besteld." : "Terug open." };
}

/** Clears everything that was ordered, so the list only shows what is still to order. */
export async function clearOrdered(): Promise<FormState> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("order_items").delete().not("ordered_at", "is", null);
  if (error) {
    console.error("Clearing ordered items failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath("/bestellijst");
  return { status: "success", message: "Bestelde regels gewist." };
}
