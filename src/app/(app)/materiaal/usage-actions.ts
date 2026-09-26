"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import {
  CATALOG_USAGE_FIELDS,
  OTHER_USAGE_FIELDS,
  USAGE_UPDATE_FIELDS,
  catalogUsageSchema,
  otherUsageSchema,
  usageUpdateSchema,
} from "@/lib/materials/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

function revalidateUsage(jobId: string, materialId: string | null) {
  revalidatePath(`/jobs/${jobId}`);
  if (materialId) {
    revalidatePath(`/materiaal/${materialId}`);
  }
}

/**
 * Adds material from the catalogue to a job. The database copies name, unit and prices and
 * sets the margin, so a later change in the catalogue does not change this job.
 */
export async function addCatalogUsage(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, CATALOG_USAGE_FIELDS);
  const input = catalogUsageSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_material_usage", {
    target_job_id: input.data.jobId,
    source_material_id: input.data.materialId,
    usage_quantity: input.data.quantity,
    per_package: input.data.per === "package",
    usage_date: input.data.usedOn,
  });
  if (error) {
    console.error("add_material_usage failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidateUsage(data.job_id, data.material_id);
  return { status: "success", message: `${data.description} toegevoegd.` };
}

/** Adds something that is not in the catalogue, priced per unit. */
export async function addOtherUsage(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, OTHER_USAGE_FIELDS);
  const input = otherUsageSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_other_material_usage", {
    target_job_id: input.data.jobId,
    usage_description: input.data.description,
    usage_unit: input.data.unit,
    unit_price_cents: input.data.unitPrice,
    usage_quantity: input.data.quantity,
    usage_date: input.data.usedOn,
  });
  if (error) {
    console.error("add_other_material_usage failed", {
      code: error.code,
      message: error.message,
    });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidateUsage(data.job_id, null);
  return { status: "success", message: `${data.description} toegevoegd.` };
}

/** Corrects the quantity or date of an entry. The price stays as it was. */
export async function updateUsage(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, USAGE_UPDATE_FIELDS);
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekend materiaal.", values };
  }
  const input = usageUpdateSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_usages")
    .update({ quantity: input.data.quantity, used_on: input.data.usedOn })
    .eq("id", id.data)
    .select("job_id, material_id")
    .single();
  if (error) {
    console.error("Updating material usage failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidateUsage(data.job_id, data.material_id);
  return { status: "success", message: "Aangepast." };
}

export async function deleteUsage(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekend materiaal." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_usages")
    .delete()
    .eq("id", id.data)
    .select("job_id, material_id")
    .single();
  if (error) {
    console.error("Deleting material usage failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidateUsage(data.job_id, data.material_id);
  return { status: "success", message: "Verwijderd." };
}
