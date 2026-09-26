import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export type RunningEntry = {
  id: string;
  jobId: string;
  jobTitle: string;
  startedAt: string;
};

/** The running clock of this user, if any. */
export async function getRunningEntry(
  supabase: Client,
  userId: string,
): Promise<RunningEntry | null> {
  const { data, error } = await supabase
    .from("time_entries")
    .select("id, job_id, started_at, jobs(title)")
    .eq("user_id", userId)
    .is("ended_at", null)
    .maybeSingle();
  if (error) {
    throw new Error(`Could not load running entry: ${error.message}`);
  }
  if (!data) {
    return null;
  }
  return {
    id: data.id,
    jobId: data.job_id,
    jobTitle: data.jobs?.title ?? "Job",
    startedAt: data.started_at,
  };
}
