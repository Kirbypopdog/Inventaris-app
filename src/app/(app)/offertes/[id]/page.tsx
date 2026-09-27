import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { DocumentTotals } from "@/components/document-totals";
import { dangerButtonClass, secondaryButtonClass } from "@/components/form";
import { EmptyState, PageHeader, cardClass, pageClass } from "@/components/page";
import { QuoteStatusBadge } from "@/components/quote-status-badge";
import { Disclosure } from "@/components/disclosure";
import { requireMember } from "@/lib/auth/session";
import { jobTabHref } from "@/lib/jobs/tabs";
import { formatDate } from "@/lib/dates";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/labels";
import { cents, formatEuro, formatEuroInput } from "@/lib/money";
import { formatQuantity, formatQuantityInput } from "@/lib/quantity";
import { documentTotals, lineNet } from "@/lib/quotes/totals";
import { createClient } from "@/lib/supabase/server";
import { deleteQuote, deleteQuoteLine, setQuoteStatus } from "../actions";
import { QuoteDetailsForm, QuoteLineForm } from "./quote-forms";

export const metadata: Metadata = { title: "Offerte · Schrijnwerk" };

/** Which status changes make sense from each status. */
const NEXT_STATUSES: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected", "draft"],
  accepted: ["sent", "draft"],
  rejected: ["sent", "draft"],
};

const STATUS_ACTION_LABELS: Record<QuoteStatus, string> = {
  draft: "Terug naar ontwerp",
  sent: "Markeer als verzonden",
  accepted: "Aanvaard door klant",
  rejected: "Geweigerd door klant",
};

export default async function QuotePage({ params }: PageProps<"/offertes/[id]">) {
  await requireMember();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) {
    notFound();
  }

  const supabase = await createClient();
  const [quoteResult, linesResult, settingsResult] = await Promise.all([
    supabase
      .from("quotes")
      .select("*, jobs(id, title, vat_rate, customers(id, name))")
      .eq("id", id.data)
      .maybeSingle(),
    supabase
      .from("quote_lines")
      .select("id, description, quantity, unit, unit_price_cents, vat_rate")
      .eq("quote_id", id.data)
      .order("created_at"),
    supabase.from("settings").select("vat_rate").single(),
  ]);
  if (quoteResult.error || linesResult.error || settingsResult.error) {
    const loadError = quoteResult.error ?? linesResult.error ?? settingsResult.error;
    throw new Error(`Could not load quote: ${loadError?.message}`);
  }
  const quote = quoteResult.data;
  if (!quote) {
    notFound();
  }

  const job = quote.jobs;
  const customer = job?.customers ?? null;
  const isDraft = quote.status === "draft";
  const lines = linesResult.data.map((line) => ({
    id: line.id,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPriceCents: line.unit_price_cents,
    vatRate: line.vat_rate,
  }));
  const totals = documentTotals(lines);
  // A new line gets the job's VAT rate, or else the general one.
  const defaultVatRate = String(job?.vat_rate ?? settingsResult.data.vat_rate);

  return (
    <main className={pageClass}>
      <PageHeader
        title={`Offerte ${quote.number}`}
        back={
          job
            ? { href: jobTabHref(job.id, "offertes"), label: job.title }
            : { href: "/offertes", label: "Offertes" }
        }
        description={
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <QuoteStatusBadge status={quote.status} />
              {customer && (
                <Link href={`/klanten/${customer.id}`} className="underline">
                  {customer.name}
                </Link>
              )}
            </span>
            <span>
              {formatDate(quote.quote_date)}
              {quote.valid_until && ` · geldig tot ${formatDate(quote.valid_until)}`}
            </span>
          </span>
        }
      />

      {!isDraft && (
        <p className="rounded-xl bg-stone-100 p-4 text-base dark:bg-stone-900">
          Deze offerte is {QUOTE_STATUS_LABELS[quote.status].toLowerCase()} en kan niet meer
          aangepast worden. Zet ze terug op ontwerp om iets te wijzigen.
        </p>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <section className="flex flex-col gap-4" aria-label="Regels">
          <h2 className="text-xl font-semibold">Regels</h2>
          {lines.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li key={line.id} className={cardClass}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-lg font-semibold break-words whitespace-pre-line">
                      {line.description}
                    </span>
                    <span className="text-lg tabular-nums">{formatEuro(lineNet(line))}</span>
                  </div>
                  <p className="text-base text-stone-600 dark:text-stone-400">
                    {formatQuantity(line.quantity)} {line.unit} ×{" "}
                    {formatEuro(cents(line.unitPriceCents))} · btw {line.vatRate}%
                  </p>
                  {isDraft && (
                    <Disclosure variant="inline" summary="Aanpassen of verwijderen">
                      <QuoteLineForm
                        line={{
                          id: line.id,
                          quoteId: quote.id,
                          description: line.description,
                          quantity: formatQuantityInput(line.quantity),
                          unit: line.unit,
                          unitPrice: formatEuroInput(cents(line.unitPriceCents)),
                          vatRate: String(line.vatRate),
                        }}
                      />
                      <ActionButton
                        action={deleteQuoteLine}
                        values={{ id: line.id }}
                        label="Regel verwijderen"
                        pendingLabel="Bezig…"
                        className={dangerButtonClass}
                        confirm="Deze regel verwijderen?"
                      />
                    </Disclosure>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Nog geen regels.</EmptyState>
          )}

          {isDraft && (
            <section className={cardClass} aria-labelledby="add-line">
              <h3 id="add-line" className="text-lg font-semibold">
                Regel toevoegen
              </h3>
              <QuoteLineForm
                line={{
                  quoteId: quote.id,
                  description: "",
                  quantity: "1",
                  unit: "stuk",
                  unitPrice: "",
                  vatRate: defaultVatRate,
                }}
              />
            </section>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <section className={cardClass} aria-label="Totaal">
            <DocumentTotals totals={totals} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold">Status</h2>
            {NEXT_STATUSES[quote.status].map((status) => (
              <ActionButton
                key={status}
                action={setQuoteStatus}
                values={{ id: quote.id, status }}
                label={STATUS_ACTION_LABELS[status]}
                pendingLabel="Bezig…"
                className={secondaryButtonClass}
              />
            ))}
            {isDraft && (
              <ActionButton
                action={deleteQuote}
                values={{ id: quote.id }}
                label="Offerte verwijderen"
                pendingLabel="Bezig…"
                className={dangerButtonClass}
                confirm={`Offerte ${quote.number} verwijderen?`}
              />
            )}
          </section>
        </aside>
      </div>

      {isDraft ? (
        <section className="flex flex-col gap-4 md:max-w-2xl">
          <h2 className="text-xl font-semibold">Datum en teksten</h2>
          <div className={cardClass}>
            <QuoteDetailsForm
              quote={{
                id: quote.id,
                quoteDate: quote.quote_date,
                validUntil: quote.valid_until ?? "",
                intro: quote.intro ?? "",
                notes: quote.notes ?? "",
              }}
            />
          </div>
        </section>
      ) : (
        (quote.intro || quote.notes) && (
          <section className="flex flex-col gap-2 md:max-w-2xl">
            {quote.intro && <p className="text-lg whitespace-pre-line">{quote.intro}</p>}
            {quote.notes && (
              <p className="text-base whitespace-pre-line text-stone-600 dark:text-stone-400">
                {quote.notes}
              </p>
            )}
          </section>
        )
      )}
    </main>
  );
}
