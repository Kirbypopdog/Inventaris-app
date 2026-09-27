import { cents, formatEuro, subtract, type Cents } from "@/lib/money";

export type BudgetLevel = "ok" | "warning" | "over";

export type Budget = {
  /** What was done so far, excl. VAT. */
  spent: Cents;
  /** The accepted quotes, excl. VAT. */
  quoteNet: Cents;
  /** Whole percent of the quote that was used, rounded down; null for a quote of €0. */
  usedPercent: number | null;
  /** Quote minus what was done: negative when the quote is exceeded. */
  remaining: Cents;
  level: BudgetLevel;
};

/**
 * How far a job is into its accepted quote. `warningPercent` comes from the settings: from
 * that part on the job gets a warning, above the quote it is over budget. Without an
 * accepted quote there is no budget to watch.
 */
export function jobBudget(
  calculation: { total: Cents; quoteNet: Cents | null },
  warningPercent: number,
): Budget | null {
  const { total, quoteNet } = calculation;
  if (quoteNet === null) {
    return null;
  }
  const remaining = subtract(quoteNet, total);
  if (quoteNet <= 0) {
    return {
      spent: total,
      quoteNet,
      usedPercent: null,
      remaining,
      level: total > 0 ? "over" : "ok",
    };
  }
  // Integers only: comparing total × 100 with quote × percent avoids rounding.
  const level: BudgetLevel =
    total > quoteNet ? "over" : total * 100 >= quoteNet * warningPercent ? "warning" : "ok";
  return {
    spent: total,
    quoteNet,
    usedPercent: Math.floor((total * 100) / quoteNet),
    remaining,
    level,
  };
}

/** One sentence on the budget: how much is left, or how far the quote is exceeded. */
export function budgetMessage(budget: Budget): string {
  switch (budget.level) {
    case "ok":
      return `Nog ${formatEuro(budget.remaining)} over.`;
    case "warning":
      return `Let op: al ${budget.usedPercent ?? 100}% van de offerte is gepresteerd. Nog ${formatEuro(budget.remaining)} over.`;
    case "over":
      return `De offerte is overschreden met ${formatEuro(subtract(cents(0), budget.remaining))}.`;
  }
}
