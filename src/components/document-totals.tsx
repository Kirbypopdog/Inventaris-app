import { formatEuro, type VatBreakdown } from "@/lib/money";

/** Totals of a quote or invoice: net, VAT per rate, total including VAT. */
export function DocumentTotals({ totals }: { totals: VatBreakdown }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-lg">
      <dt>Totaal excl. btw</dt>
      <dd className="text-right tabular-nums">{formatEuro(totals.totalNet)}</dd>
      {totals.perRate.map((rate) => (
        <div key={rate.vatRate} className="contents">
          <dt className="text-stone-600 dark:text-stone-400">
            Btw {rate.vatRate}% op {formatEuro(rate.net)}
          </dt>
          <dd className="text-right text-stone-600 tabular-nums dark:text-stone-400">
            {formatEuro(rate.vat)}
          </dd>
        </div>
      ))}
      <dt className="border-t border-stone-300 pt-2 font-semibold dark:border-stone-700">
        Totaal incl. btw
      </dt>
      <dd className="border-t border-stone-300 pt-2 text-right font-semibold tabular-nums dark:border-stone-700">
        {formatEuro(totals.totalGross)}
      </dd>
    </dl>
  );
}
