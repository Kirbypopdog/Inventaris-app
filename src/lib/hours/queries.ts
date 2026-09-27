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

export type OtherRunningEntry = RunningEntry & { userName: string };

/** Clocks of other members that are still running, so a forgotten one is easy to find. */
export async function getOtherRunningEntries(
  supabase: Client,
  userId: string,
): Promise<OtherRunningEntry[]> {
  const [entries, members] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, job_id, user_id, started_at, jobs(title)")
      .neq("user_id", userId)
      .is("ended_at", null)
      .order("started_at"),
    supabase.from("app_users").select("user_id, display_name"),
  ]);
  if (entries.error || members.error) {
    throw new Error(`Could not load running entries: ${(entries.error ?? members.error)?.message}`);
  }
  const names = new Map(members.data.map((member) => [member.user_id, member.display_name]));
  return entries.data.map((entry) => ({
    id: entry.id,
    jobId: entry.job_id,
    jobTitle: entry.jobs?.title ?? "Job",
    startedAt: entry.started_at,
    userName: names.get(entry.user_id) ?? "Oud-lid",
  }));
}
