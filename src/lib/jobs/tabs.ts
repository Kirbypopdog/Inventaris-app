import { z } from "zod";

/** The tabs of a job page, in order. The first one is shown without `?tab=`. */
export const JOB_TABS = [
  { key: "overzicht", label: "Overzicht" },
  { key: "uren", label: "Uren" },
  { key: "materiaal", label: "Materiaal" },
  { key: "ritten", label: "Ritten" },
  { key: "offertes", label: "Offertes" },
  { key: "gegevens", label: "Gegevens" },
] as const;

export type JobTab = (typeof JOB_TABS)[number]["key"];

const tabSchema = z
  .enum(JOB_TABS.map((tab) => tab.key) as [JobTab, ...JobTab[]])
  .catch("overzicht");

/** The tab from the URL; anything unknown opens the overview. */
export function parseJobTab(value: unknown): JobTab {
  return tabSchema.parse(value);
}

export function jobTabHref(jobId: string, tab: JobTab): string {
  return tab === "overzicht" ? `/jobs/${jobId}` : `/jobs/${jobId}?tab=${tab}`;
}
