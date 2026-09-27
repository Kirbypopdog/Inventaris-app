import { type Budget, type BudgetLevel, budgetMessage } from "@/lib/budget";
import { formatEuro } from "@/lib/money";

const BAR_CLASSES: Record<BudgetLevel, string> = {
  ok: "bg-brand-600 dark:bg-brand-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  over: "bg-red-600 dark:bg-red-500",
};

const MESSAGE_CLASSES: Record<Exclude<BudgetLevel, "ok">, string> = {
  warning: "rounded-xl bg-amber-50 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  over: "rounded-xl bg-red-50 p-3 text-red-900 dark:bg-red-950 dark:text-red-200",
};

/** How far a job is into its accepted quote, as a bar that turns amber, then red. */
export function BudgetBar({ budget }: { budget: Budget }) {
  const width = Math.min(100, budget.usedPercent ?? 100);
  return (
    <section
      aria-label="Budget"
      className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:max-w-3xl dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Budget</h2>
        {budget.usedPercent !== null && (
          <span className="text-lg font-semibold tabular-nums">{budget.usedPercent}%</span>
        )}
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800" aria-hidden>
        <div
          className={`h-full rounded-full ${BAR_CLASSES[budget.level]}`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-base text-stone-600 dark:text-stone-400">
        <span className="tabular-nums">{formatEuro(budget.spent)}</span> van{" "}
        <span className="tabular-nums">{formatEuro(budget.quoteNet)}</span> (aanvaarde offerte,
        excl. btw)
        {budget.level === "ok" && <> · {budgetMessage(budget)}</>}
      </p>
      {budget.level !== "ok" && (
        <p className={`text-base ${MESSAGE_CLASSES[budget.level]}`}>{budgetMessage(budget)}</p>
      )}
    </section>
  );
}
