import type { Metadata } from "next";
import { FilterChips } from "@/components/filter-chips";
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
      <FilterChips
        label="Filter op status"
        chips={chips.map((chip) => ({
          label: chip.label,
          href: chip.status ? `/offertes?status=${chip.status}` : "/offertes",
          active: chip.status === status,
        }))}
      />
      {quotes.length > 0 ? (
        <QuoteList quotes={quotes} showJob />
      ) : (
        <EmptyState>Nog geen offertes{status ? " met deze status" : ""}.</EmptyState>
      )}
    </main>
  );
}
