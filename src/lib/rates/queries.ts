import "server-only";
import { cents, formatEuro } from "@/lib/money";
import type { createClient } from "@/lib/supabase/server";
import type { RateOption } from "./schemas";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Rates that can be chosen for a job, plus the job's current rate if it was archived. */
export async function getRateOptions(
  supabase: Client,
  currentRateId: string | null = null,
): Promise<RateOption[]> {
  const { data, error } = await supabase
    .from("hourly_rates")
    .select("id, name, rate_cents, archived_at")
    .order("name");
  if (error) {
    throw new Error(`Could not load hourly rates: ${error.message}`);
  }
  return data
    .filter((rate) => rate.archived_at === null || rate.id === currentRateId)
    .map((rate) => ({
      id: rate.id,
      label: `${rate.name} (${formatEuro(cents(rate.rate_cents))}/u)${rate.archived_at ? " – gearchiveerd" : ""}`,
    }));
}
