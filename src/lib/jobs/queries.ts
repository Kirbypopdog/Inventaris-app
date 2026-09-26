import "server-only";
import type { JobListItem } from "@/components/job-list";
import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Columns for job lists, with the customer's name. */
export const JOB_LIST_SELECT =
  "id, title, status, starts_on, ends_on, city, customers(name, city)" as const;

type JobListRow = {
  id: string;
  title: string;
  status: JobListItem["status"];
  starts_on: string | null;
  ends_on: string | null;
  city: string | null;
  customers: { name: string; city: string | null } | null;
};

export function toJobListItem(row: JobListRow): JobListItem {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    customerName: row.customers?.name ?? null,
    // The job's own address, or else the customer's.
    city: row.city ?? row.customers?.city ?? null,
  };
}

export function jobsQuery(supabase: Client) {
  return supabase
    .from("jobs")
    .select(JOB_LIST_SELECT)
    .order("starts_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
}
