/** Characters allowed in a search term. Everything else is removed, so the term is safe to
 * put in a PostgREST filter without escaping. */
const DISALLOWED = /[^\p{L}\p{N}\s\-'.@&/]/gu;

export function cleanSearchTerm(input: string | string[] | undefined): string {
  const value = Array.isArray(input) ? (input[0] ?? "") : (input ?? "");
  return value.replace(DISALLOWED, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

/**
 * A PostgREST `or` filter that matches the term anywhere in one of the columns, ignoring
 * case. Returns null for an empty term.
 */
export function ilikeAnyFilter(columns: readonly string[], term: string): string | null {
  const cleaned = cleanSearchTerm(term);
  if (!cleaned) {
    return null;
  }
  return columns.map((column) => `${column}.ilike."%${cleaned}%"`).join(",");
}
