import "server-only";
import type { TravelMethod } from "@/lib/labels";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export type TravelTerms = { method: TravelMethod; rateCents: number };

export type JobTrip = {
  id: string;
  tripDate: string;
  method: "per_km" | "flat";
  distanceKm: number | null;
  rateCents: number;
  note: string | null;
};

/** How trips to a job are charged (job > customer > general), and the trips so far. */
export async function getJobTrips(
  supabase: Client,
  jobId: string,
): Promise<{ terms: TravelTerms; trips: JobTrip[] }> {
  const [termsResult, tripsResult] = await Promise.all([
    supabase.rpc("travel_terms", { target_job_id: jobId }).single(),
    supabase
      .from("trips")
      .select("id, trip_date, method, distance_km, rate_cents, note")
      .eq("job_id", jobId)
      .order("trip_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (termsResult.error || tripsResult.error) {
    throw new Error(`Could not load trips: ${(termsResult.error ?? tripsResult.error)?.message}`);
  }

  const trips = tripsResult.data.map((trip) => {
    // The database only allows trips per km or for a fixed amount.
    if (trip.method === "included") {
      throw new Error(`Trip ${trip.id} has method "included"`);
    }
    return {
      id: trip.id,
      tripDate: trip.trip_date,
      method: trip.method,
      distanceKm: trip.distance_km,
      rateCents: trip.rate_cents,
      note: trip.note,
    };
  });
  return {
    terms: { method: termsResult.data.method, rateCents: termsResult.data.rate_cents },
    trips,
  };
}
