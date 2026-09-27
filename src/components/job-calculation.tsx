import type { JobCalculation } from "@/lib/analyses";
import { cents, formatEuro, subtract } from "@/lib/money";
import { formatDuration } from "@/lib/time";

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <>
      <dt className={strong ? "font-semibold" : "text-stone-600 dark:text-stone-400"}>{label}</dt>
      <dd className={`text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{value}</dd>
    </>
  );
}

/** Post-calculation of a job, all amounts excl. VAT. */
export function JobCalculationSummary({ calculation }: { calculation: JobCalculation }) {
  const { difference } = calculation;
  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-base">
        <Row
          label={`Uren (${formatDuration(calculation.minutes)})`}
          value={formatEuro(calculation.labour)}
        />
        <Row label="Materiaal (kostprijs)" value={formatEuro(calculation.materialCost)} />
        <Row label="Materiaal met marge" value={formatEuro(calculation.materialSale)} />
        <Row label="Verplaatsingen" value={formatEuro(calculation.travel)} />
        <Row label="Totaal gepresteerd" value={formatEuro(calculation.total)} strong />
        {calculation.quoteNet !== null && (
          <Row label="Aanvaarde offerte" value={formatEuro(calculation.quoteNet)} />
        )}
      </dl>
      {difference !== null && (
        <p
          className={`rounded-xl p-3 text-base ${
            difference >= 0
              ? "bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200"
              : "bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
          }`}
        >
          {difference >= 0
            ? `De offerte dekt het werk, met ${formatEuro(difference)} over.`
            : `Er is ${formatEuro(subtract(cents(0), difference))} meer gepresteerd dan de offerte.`}
        </p>
      )}
      <p className="text-sm text-stone-500">
        Bedragen excl. btw. Uren tegen het tarief, materiaal met de marge. Een lopende klok telt pas
        mee als hij gestopt is.
      </p>
    </div>
  );
}
