import Link from "next/link";
import { QuoteStatusBadge } from "@/components/quote-status-badge";
import { formatDate } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import type { QuoteListItem } from "@/lib/quotes/queries";

export function QuoteList({ quotes, showJob }: { quotes: QuoteListItem[]; showJob: boolean }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {quotes.map((quote) => (
        <li key={quote.id}>
          <Link
            href={`/offertes/${quote.id}`}
            className="flex min-h-16 flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-600"
          >
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-lg font-semibold">{quote.number}</span>
              <QuoteStatusBadge status={quote.status} />
            </span>
            <span className="flex flex-wrap justify-between gap-2 text-base text-stone-600 dark:text-stone-400">
              <span>
                {[
                  showJob ? quote.jobTitle : null,
                  showJob ? quote.customerName : null,
                  formatDate(quote.quoteDate),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <span className="tabular-nums">{formatEuro(quote.totalGross)} incl. btw</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
