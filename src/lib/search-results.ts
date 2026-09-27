import { z } from "zod";

export const SEARCH_KIND_LABELS = {
  job: "Job",
  customer: "Klant",
  quote: "Offerte",
  material: "Materiaal",
} as const;

export type SearchKind = keyof typeof SEARCH_KIND_LABELS;

const kinds = Object.keys(SEARCH_KIND_LABELS) as [SearchKind, ...SearchKind[]];

/** One row of search_all, checked at the boundary. */
export const searchResultSchema = z.object({
  kind: z.enum(kinds),
  id: z.uuid(),
  title: z.string(),
  detail: z.string().nullable(),
  rank: z.number(),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

const PATHS: Record<SearchKind, string> = {
  job: "/jobs",
  customer: "/klanten",
  quote: "/offertes",
  material: "/materiaal",
};

export function searchResultHref(result: Pick<SearchResult, "kind" | "id">): string {
  return `${PATHS[result.kind]}/${result.id}`;
}
