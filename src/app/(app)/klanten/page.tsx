import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, linkButtonClass, pageClass } from "@/components/page";
import { SearchForm } from "@/components/search-form";
import { requireMember } from "@/lib/auth/session";
import { CUSTOMER_TYPE_LABELS } from "@/lib/labels";
import { cleanSearchTerm, ilikeAnyFilter } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Klanten · Schrijnwerk" };

export default async function CustomersPage({ searchParams }: PageProps<"/klanten">) {
  await requireMember();
  const params = await searchParams;
  const term = cleanSearchTerm(params.q);
  const showArchived = params.archief === "1";

  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("id, name, type, city, phone, archived_at")
    .order("name");
  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const filter = ilikeAnyFilter(["name", "city", "email", "phone"], term);
  if (filter) {
    query = query.or(filter);
  }
  const { data: customers, error } = await query;
  if (error) {
    throw new Error(`Could not load customers: ${error.message}`);
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title={showArchived ? "Gearchiveerde klanten" : "Klanten"}
        action={
          <Link href="/klanten/nieuw" className={linkButtonClass}>
            Nieuwe klant
          </Link>
        }
      />
      <SearchForm
        label="Zoek op naam, gemeente, e-mail of telefoon"
        defaultValue={term}
        hidden={showArchived ? { archief: "1" } : undefined}
      />
      {customers.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/klanten/${customer.id}`}
                className="flex min-h-16 flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-600"
              >
                <span className="text-lg font-semibold break-words">{customer.name}</span>
                <span className="text-base text-stone-600 dark:text-stone-400">
                  {[CUSTOMER_TYPE_LABELS[customer.type], customer.city, customer.phone]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>
          {term ? `Geen klanten gevonden voor "${term}".` : "Nog geen klanten."}
        </EmptyState>
      )}
      <Link
        href={showArchived ? "/klanten" : "/klanten?archief=1"}
        className="self-start py-2 text-base text-stone-600 underline dark:text-stone-400"
      >
        {showArchived ? "← Terug naar de klanten" : "Gearchiveerde klanten bekijken"}
      </Link>
    </main>
  );
}
