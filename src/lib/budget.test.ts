import { describe, expect, it } from "vitest";
import { budgetMessage, jobBudget } from "./budget";
import { cents } from "./money";

const budget = (total: number, quoteNet: number | null, warningPercent = 80) =>
  jobBudget(
    { total: cents(total), quoteNet: quoteNet === null ? null : cents(quoteNet) },
    warningPercent,
  );

describe("jobBudget", () => {
  it("has no budget without an accepted quote", () => {
    expect(budget(100_00, null)).toBeNull();
  });

  it("is fine below the warning level", () => {
    expect(budget(3999_99, 5000_00)).toEqual({
      spent: 3999_99,
      quoteNet: 5000_00,
      usedPercent: 79,
      remaining: 1000_01,
      level: "ok",
    });
  });

  it("warns from exactly the warning level, without rounding up", () => {
    expect(budget(4000_00, 5000_00)?.level).toBe("warning");
    expect(budget(3999_99, 5000_00)?.level).toBe("ok");
    expect(budget(4999_99, 5000_00)?.usedPercent).toBe(99);
  });

  it("still warns at exactly the quote, and is over above it", () => {
    expect(budget(5000_00, 5000_00)).toMatchObject({ level: "warning", usedPercent: 100 });
    expect(budget(5250_00, 5000_00)).toMatchObject({
      level: "over",
      usedPercent: 105,
      remaining: -250_00,
    });
  });

  it("follows the warning level from the settings", () => {
    expect(budget(4000_00, 5000_00, 90)?.level).toBe("ok");
    expect(budget(4500_00, 5000_00, 90)?.level).toBe("warning");
    expect(budget(1_00, 5000_00, 1)?.level).toBe("ok");
    expect(budget(50_00, 5000_00, 1)?.level).toBe("warning");
  });

  it("handles a quote of €0", () => {
    expect(budget(0, 0)).toMatchObject({ level: "ok", usedPercent: null });
    expect(budget(10_00, 0)).toMatchObject({ level: "over", usedPercent: null, remaining: -10_00 });
  });
});

describe("budgetMessage", () => {
  const message = (total: number, quoteNet: number) => {
    const result = budget(total, quoteNet);
    if (!result) throw new Error("expected a budget");
    return budgetMessage(result).replace(/\s/g, " ");
  };

  it("says what is left, warns, or says how far the quote is exceeded", () => {
    expect(message(1000_00, 5000_00)).toBe("Nog € 4.000,00 over.");
    expect(message(4100_00, 5000_00)).toBe(
      "Let op: al 82% van de offerte is gepresteerd. Nog € 900,00 over.",
    );
    expect(message(5250_00, 5000_00)).toBe("De offerte is overschreden met € 250,00.");
  });
});
