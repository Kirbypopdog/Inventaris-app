import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, PageHeader, pageClass } from "@/components/page";
import { QuoteList } from "@/components/quote-list";
import { requireMember } from "@/lib/auth/session";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/labels";
import { quotesQuery, toQuoteListItem } from "@/lib/quotes/queries";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/supabase/database.types";
import { z } from "zod";

export const metadata: Metadata = { title: "Offertes · Schrijnwerk" };

const statusSchema = z.enum(Constants.public.Enums.quote_status);

export default async function QuotesPage({ searchParams }: PageProps<"/offertes">) {
  await requireMember();
  const parsedStatus = statusSchema.safeParse((await searchParams).status);
  const status = parsedStatus.success ? parsedStatus.data : null;

  const supabase = await createClient();
  let query = quotesQuery(supabase);
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Could not load quotes: ${error.message}`);
  }
  const quotes = data.map(toQuoteListItem);

  const chips: { status: QuoteStatus | null; label: string }[] = [
    { status: null, label: "Alle" },
    ...(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((value) => ({
      status: value,
      label: QUOTE_STATUS_LABELS[value],
    })),
  ];

  return (
    <main className={pageClass}>
      <PageHeader title="Offertes" description="Een nieuwe offerte maak je vanop de job." />
      <nav aria-label="Filter op status" className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = chip.status === status;
          return (
            <Link
              key={chip.label}
              href={chip.status ? `/offertes?status=${chip.status}` : "/offertes"}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-12 items-center rounded-full border px-4 text-base ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>
      {quotes.length > 0 ? (
        <QuoteList quotes={quotes} showJob />
      ) : (
        <EmptyState>Nog geen offertes{status ? " met deze status" : ""}.</EmptyState>
      )}
    </main>
  );
}
