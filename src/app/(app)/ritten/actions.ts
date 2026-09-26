"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/auth/session";
import { saveErrorMessage } from "@/lib/database-errors";
import { field, firstIssue, formValues, type FormState } from "@/lib/forms";
import {
  TRIP_FIELDS,
  TRIP_UPDATE_FIELDS,
  distanceIssue,
  tripSchema,
  tripUpdateSchema,
} from "@/lib/trips/schemas";
import { createClient } from "@/lib/supabase/server";

const idSchema = z.uuid();

/** Adds a trip. The database picks the method and rate (job > customer > general). */
export async function addTrip(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, TRIP_FIELDS);
  const input = tripSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_trip", {
    target_job_id: input.data.jobId,
    on_date: input.data.tripDate,
    // Left out when empty: the function then uses null.
    distance: input.data.distance ?? undefined,
    trip_note: input.data.note ?? undefined,
  });
  if (error) {
    console.error("add_trip failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(`/jobs/${input.data.jobId}`);
  return { status: "success", message: "Rit toegevoegd." };
}

/** Corrects the date, distance or note of a trip. The rate stays as it was. */
export async function updateTrip(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const values = formValues(formData, TRIP_UPDATE_FIELDS);
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende rit.", values };
  }
  const input = tripUpdateSchema.safeParse(values);
  if (!input.success) {
    return { status: "error", message: firstIssue(input.error), values };
  }

  const supabase = await createClient();
  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("method")
    .eq("id", id.data)
    .single();
  if (tripError) {
    console.error("Loading trip failed", { code: tripError.code, message: tripError.message });
    return { status: "error", message: saveErrorMessage(tripError), values };
  }
  if (trip.method === "included") {
    return { status: "error", message: saveErrorMessage({ code: "TS004" }), values };
  }
  const issue = distanceIssue(trip.method, input.data.distance);
  if (issue) {
    return { status: "error", message: issue, values };
  }

  const { data, error } = await supabase
    .from("trips")
    .update({
      trip_date: input.data.tripDate,
      distance_km: trip.method === "per_km" ? input.data.distance : null,
      note: input.data.note,
    })
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Updating trip failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error), values };
  }
  revalidatePath(`/jobs/${data.job_id}`);
  return { status: "success", message: "Rit aangepast." };
}

export async function deleteTrip(_previous: FormState, formData: FormData): Promise<FormState> {
  await requireMember();
  const id = idSchema.safeParse(field(formData, "id"));
  if (!id.success) {
    return { status: "error", message: "Onbekende rit." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .delete()
    .eq("id", id.data)
    .select("job_id")
    .single();
  if (error) {
    console.error("Deleting trip failed", { code: error.code, message: error.message });
    return { status: "error", message: saveErrorMessage(error) };
  }
  revalidatePath(`/jobs/${data.job_id}`);
  return { status: "success", message: "Verwijderd." };
}
