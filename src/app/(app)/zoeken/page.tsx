import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, pageClass } from "@/components/page";
import { SearchForm } from "@/components/search-form";
import { requireMember } from "@/lib/auth/session";
import { cleanSearchTerm } from "@/lib/search";
import {
  SEARCH_KIND_LABELS,
  searchResultHref,
  searchResultSchema,
  type SearchResult,
} from "@/lib/search-results";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Zoeken · Schrijnwerk" };

export default async function SearchPage({ searchParams }: PageProps<"/zoeken">) {
  await requireMember();
  const term = cleanSearchTerm((await searchParams).q);

  let results: SearchResult[] = [];
  if (term) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_all", { search_term: term });
    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
    results = searchResultSchema.array().parse(data);
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title="Zoeken"
        description="In jobs, klanten, offertes en materiaal. Bv. “eiken trap”, “Brugge” of “scharnier”."
      />
      <SearchForm label="Wat zoek je?" defaultValue={term} />
      {term &&
        (results.length > 0 ? (
          <ul className="flex flex-col gap-3" aria-label="Resultaten">
            {results.map((result) => (
              <li key={`${result.kind}-${result.id}`}>
                <Link
                  href={searchResultHref(result)}
                  className="flex min-h-16 flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-600"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-sm font-medium dark:bg-stone-800">
                      {SEARCH_KIND_LABELS[result.kind]}
                    </span>
                    <span className="text-lg font-semibold break-words">{result.title}</span>
                  </span>
                  {result.detail && (
                    <span className="text-base break-words text-stone-600 dark:text-stone-400">
                      {result.detail}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Niets gevonden voor &quot;{term}&quot;.</EmptyState>
        ))}
    </main>
  );
}
