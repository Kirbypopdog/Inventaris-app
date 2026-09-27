import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, linkButtonClass, pageClass } from "@/components/page";
import { SearchForm } from "@/components/search-form";
import { requireMember } from "@/lib/auth/session";
import { describePrice } from "@/lib/materials/format";
import { cleanSearchTerm, ilikeAnyFilter } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Materiaal · Schrijnwerk" };

export default async function MaterialsPage({ searchParams }: PageProps<"/materiaal">) {
  await requireMember();
  const params = await searchParams;
  const term = cleanSearchTerm(params.q);
  const showArchived = params.archief === "1";

  const supabase = await createClient();
  let query = supabase
    .from("materials")
    .select("id, name, unit, package_price_cents, units_per_package, supplier")
    .order("name");
  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const filter = ilikeAnyFilter(["name", "supplier"], term);
  if (filter) {
    query = query.or(filter);
  }
  const { data: materials, error } = await query;
  if (error) {
    throw new Error(`Could not load materials: ${error.message}`);
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title={showArchived ? "Gearchiveerd materiaal" : "Materiaal"}
        description="Je catalogus. Op een job voeg je materiaal toe vanuit deze lijst."
        action={
          <Link href="/materiaal/nieuw" className={linkButtonClass}>
            Nieuw materiaal
          </Link>
        }
      />
      <SearchForm
        label="Zoek op naam of leverancier"
        defaultValue={term}
        hidden={showArchived ? { archief: "1" } : undefined}
      />
      {materials.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <li key={material.id}>
              <Link
                href={`/materiaal/${material.id}`}
                className="flex min-h-16 flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-600"
              >
                <span className="text-lg font-semibold break-words">{material.name}</span>
                <span className="text-base text-stone-600 dark:text-stone-400">
                  {describePrice({
                    packagePriceCents: material.package_price_cents,
                    unitsPerPackage: material.units_per_package,
                    unit: material.unit,
                  })}
                </span>
                {material.supplier && (
                  <span className="text-sm text-stone-500">{material.supplier}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>
          {term ? `Geen materiaal gevonden voor "${term}".` : "Nog geen materiaal in de catalogus."}
        </EmptyState>
      )}
      <Link
        href={showArchived ? "/materiaal" : "/materiaal?archief=1"}
        className="self-start py-2 text-base text-stone-600 underline dark:text-stone-400"
      >
        {showArchived ? "← Terug naar het materiaal" : "Gearchiveerd materiaal bekijken"}
      </Link>
    </main>
  );
}
