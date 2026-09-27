import "server-only";
import {
  isFinished,
  type AnalysisEntry,
  type AnalysisTrip,
  type AnalysisUsage,
} from "@/lib/analyses";
import type { PricedLine } from "@/lib/quotes/totals";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export type JobActivity = {
  entries: AnalysisEntry[];
  usages: AnalysisUsage[];
  trips: AnalysisTrip[];
  acceptedQuoteLines: PricedLine[][];
};

export type AnalysisData = JobActivity & {
  byJob: Map<string, JobActivity>;
};

function emptyActivity(): JobActivity {
  return { entries: [], usages: [], trips: [], acceptedQuoteLines: [] };
}

/**
 * Finished hours, material, trips and accepted quotes, optionally for one job or a few, grouped
 * per job. Every row is fetched, page by page.
 */
export async function loadAnalysisData(
  supabase: Client,
  jobId: string | readonly string[] | null = null,
): Promise<AnalysisData> {
  const jobIds = typeof jobId === "string" ? [jobId] : jobId;
  const [entries, usages, trips, quotes] = await Promise.all([
    fetchAll((from, to) => {
      let query = supabase
        .from("time_entries")
        .select("id, job_id, started_at, ended_at, hourly_rate_cents")
        .not("ended_at", "is", null);
      if (jobIds) query = query.in("job_id", [...jobIds]);
      return query.order("id").range(from, to);
    }),
    fetchAll((from, to) => {
      let query = supabase
        .from("material_usages")
        .select("id, job_id, package_price_cents, units_per_package, quantity, margin_bp, used_on");
      if (jobIds) query = query.in("job_id", [...jobIds]);
      return query.order("id").range(from, to);
    }),
    fetchAll((from, to) => {
      let query = supabase
        .from("trips")
        .select("id, job_id, method, distance_km, rate_cents, trip_date");
      if (jobIds) query = query.in("job_id", [...jobIds]);
      return query.order("id").range(from, to);
    }),
    fetchAll((from, to) => {
      let query = supabase
        .from("quotes")
        .select("id, job_id, quote_lines(quantity, unit_price_cents, vat_rate)")
        .eq("status", "accepted");
      if (jobIds) query = query.in("job_id", [...jobIds]);
      return query.order("id").range(from, to);
    }),
  ]);

  const data: AnalysisData = { ...emptyActivity(), byJob: new Map() };
  const forJob = (id: string): JobActivity => {
    let activity = data.byJob.get(id);
    if (!activity) {
      activity = emptyActivity();
      data.byJob.set(id, activity);
    }
    return activity;
  };

  for (const row of entries) {
    const entry = {
      startedAt: row.started_at,
      endedAt: row.ended_at,
      hourlyRateCents: row.hourly_rate_cents,
    };
    // The query only returns finished entries; the check keeps the types honest.
    if (isFinished(entry)) {
      data.entries.push(entry);
      forJob(row.job_id).entries.push(entry);
    }
  }
  for (const row of usages) {
    const usage = {
      packagePriceCents: row.package_price_cents,
      unitsPerPackage: row.units_per_package,
      quantity: row.quantity,
      marginBp: row.margin_bp,
      usedOn: row.used_on,
    };
    data.usages.push(usage);
    forJob(row.job_id).usages.push(usage);
  }
  for (const row of trips) {
    // The database only allows trips per km or for a fixed amount.
    if (row.method === "included") {
      throw new Error(`Trip ${row.id} has method "included"`);
    }
    const trip = {
      method: row.method,
      distanceKm: row.distance_km,
      rateCents: row.rate_cents,
      tripDate: row.trip_date,
    };
    data.trips.push(trip);
    forJob(row.job_id).trips.push(trip);
  }
  for (const row of quotes) {
    const lines = row.quote_lines.map((line) => ({
      quantity: line.quantity,
      unitPriceCents: line.unit_price_cents,
      vatRate: line.vat_rate,
    }));
    data.acceptedQuoteLines.push(lines);
    forJob(row.job_id).acceptedQuoteLines.push(lines);
  }
  return data;
}
