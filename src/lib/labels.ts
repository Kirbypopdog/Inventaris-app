import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
export type CustomerType = Enums["customer_type"];
export type JobStatus = Enums["job_status"];

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  private: "Particulier",
  business: "Bedrijf",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  planned: "Gepland",
  active: "Bezig",
  done: "Afgewerkt",
  cancelled: "Geannuleerd",
};

/** Statuses of jobs that still need work, shown on the start page. */
export const OPEN_JOB_STATUSES: readonly JobStatus[] = ["planned", "active"];
