import "server-only";
import type { QuoteStatus } from "@/lib/labels";
import type { Cents } from "@/lib/money";
import type { createClient } from "@/lib/supabase/server";
import { documentTotals } from "./totals";

type Client = Awaited<ReturnType<typeof createClient>>;

export type QuoteListItem = {
  id: string;
  number: string;
  status: QuoteStatus;
  quoteDate: string;
  jobTitle: string | null;
  customerName: string | null;
  totalGross: Cents;
};

/** Quotes with what a list needs, newest first. Filter further on the returned query. */
export function quotesQuery(supabase: Client) {
  return supabase
    .from("quotes")
    .select(
      "id, number, status, quote_date, job_id, jobs(title, customers(name)), quote_lines(quantity, unit_price_cents, vat_rate)",
    )
    .order("quote_date", { ascending: false })
    .order("number", { ascending: false });
}

type QuoteRow = {
  id: string;
  number: string;
  status: QuoteStatus;
  quote_date: string;
  jobs: { title: string; customers: { name: string } | null } | null;
  quote_lines: { quantity: number; unit_price_cents: number; vat_rate: number }[];
};

export function toQuoteListItem(row: QuoteRow): QuoteListItem {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    quoteDate: row.quote_date,
    jobTitle: row.jobs?.title ?? null,
    customerName: row.jobs?.customers?.name ?? null,
    totalGross: documentTotals(
      row.quote_lines.map((line) => ({
        quantity: line.quantity,
        unitPriceCents: line.unit_price_cents,
        vatRate: line.vat_rate,
      })),
    ).totalGross,
  };
}
