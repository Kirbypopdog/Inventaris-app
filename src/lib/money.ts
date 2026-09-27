/**
 * All money in the app is an integer number of euro cents. This module is the
 * single place where amounts are created, rounded, combined and formatted.
 */

declare const centsBrand: unique symbol;

/** An integer amount of euro cents. Create one with {@link cents} or {@link parseEuro}. */
export type Cents = number & { readonly [centsBrand]: true };

/** Percentage in basis points: 100 bp = 1%, so 12,5% = 1250. Keeps percentages integer too. */
export type BasisPoints = number;

/** Belgian VAT rates. */
export const VAT_RATES = [0, 6, 12, 21] as const;
export type VatRate = (typeof VAT_RATES)[number];

export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Bedrag moet een geheel aantal cent zijn, kreeg ${value}`);
  }
  return (value + 0) as Cents; // + 0 turns -0 into 0
}

/** Divides and rounds half away from zero (the usual commercial rounding, also for credit notes). */
function divideRounded(numerator: number, denominator: number): Cents {
  if (denominator === 0) {
    throw new RangeError("Deling door nul");
  }
  const quotient = numerator / denominator;
  return cents(Math.sign(quotient) * Math.round(Math.abs(quotient)));
}

export function add(...amounts: Cents[]): Cents {
  return cents(amounts.reduce<number>((sum, amount) => sum + amount, 0));
}

export function subtract(a: Cents, b: Cents): Cents {
  return cents(a - b);
}

/**
 * Price of a quantity that is part of a package, rounded once.
 * Example: a box of 200 screws costs €12,00, 35 screws cost €2,10.
 * `quantity` may be fractional (e.g. 2.5 m of a 10 m roll) but is kept to
 * at most 3 decimals so the calculation stays exact.
 */
export function partOfPackage(
  packagePrice: Cents,
  unitsPerPackage: number,
  quantity: number,
): Cents {
  if (!(unitsPerPackage > 0)) {
    throw new RangeError("Aantal per verpakking moet groter zijn dan 0");
  }
  const scale = 1000;
  const scaledQuantity = Math.round(quantity * scale);
  const scaledUnits = Math.round(unitsPerPackage * scale);
  return divideRounded(packagePrice * scaledQuantity, scaledUnits);
}

/** Hourly rate × worked minutes, rounded once. */
export function forMinutes(hourlyRate: Cents, minutes: number): Cents {
  if (!Number.isSafeInteger(minutes) || minutes < 0) {
    throw new RangeError("Minuten moeten een positief geheel getal zijn");
  }
  return divideRounded(hourlyRate * minutes, 60);
}

/** Amount × unit price, e.g. kilometres × rate per km. Quantity is kept to 3 decimals. */
export function multiply(unitPrice: Cents, quantity: number): Cents {
  return partOfPackage(unitPrice, 1, quantity);
}

/** Percentage of an amount, e.g. a 15% margin (1500 bp) on material cost. */
export function percentageOf(amount: Cents, rate: BasisPoints): Cents {
  if (!Number.isSafeInteger(rate)) {
    throw new RangeError("Percentage moet in hele basispunten (1% = 100)");
  }
  return divideRounded(amount * rate, 10_000);
}

/** Amount plus a margin in basis points. */
export function withMargin(cost: Cents, margin: BasisPoints): Cents {
  return add(cost, percentageOf(cost, margin));
}

export type VatLine = { net: Cents; vatRate: VatRate };

export type VatBreakdown = {
  perRate: { vatRate: VatRate; net: Cents; vat: Cents }[];
  totalNet: Cents;
  totalVat: Cents;
  totalGross: Cents;
};

/**
 * VAT is calculated per rate on the sum of the lines with that rate, not per
 * line. This matches how the Peppol/UBL standard checks totals.
 */
export function vatBreakdown(lines: readonly VatLine[]): VatBreakdown {
  const netPerRate = new Map<VatRate, Cents>();
  for (const line of lines) {
    netPerRate.set(line.vatRate, add(netPerRate.get(line.vatRate) ?? cents(0), line.net));
  }

  const perRate = [...netPerRate.entries()]
    .sort(([a], [b]) => a - b)
    .map(([vatRate, net]) => ({ vatRate, net, vat: percentageOf(net, vatRate * 100) }));

  const totalNet = add(...perRate.map((r) => r.net));
  const totalVat = add(...perRate.map((r) => r.vat));
  return { perRate, totalNet, totalVat, totalGross: add(totalNet, totalVat) };
}

/**
 * Parses what a user types in a price field: "12,50", "12.50", "€ 1.234,56",
 * "1234" or "-3,5". Returns null when the input is not a valid amount.
 */
export function parseEuro(input: string): Cents | null {
  const cleaned = input.replace(/[€\s]/g, "");
  const match = /^(-)?(\d{1,3}(?:\.\d{3})+|\d+)(?:[,.](\d{1,2}))?$/.exec(cleaned);
  if (!match) {
    return null;
  }
  const [, sign, whole = "", fraction = ""] = match;
  const euros = Number(whole.replaceAll(".", ""));
  const centsPart = Number(fraction.padEnd(2, "0"));
  const value = euros * 100 + centsPart;
  if (!Number.isSafeInteger(value)) {
    return null;
  }
  return cents(sign ? -value : value);
}

const euroFormat = new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" });

export function formatEuro(amount: Cents): string {
  return euroFormat.format(amount / 100);
}

/** An amount as it is typed in a form field, e.g. "1234,50". {@link parseEuro} reads it back. */
export function formatEuroInput(amount: Cents): string {
  const sign = amount < 0 ? "-" : "";
  const absolute = Math.abs(amount);
  return `${sign}${Math.trunc(absolute / 100)},${String(absolute % 100).padStart(2, "0")}`;
}

const unitPriceFormat = new Intl.NumberFormat("nl-BE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

/**
 * Price of one unit out of a package, for display only: a screw from a box of 200 at
 * €12,50 costs €0,0625. Amounts are always calculated with {@link partOfPackage}.
 */
export function formatUnitPrice(packagePrice: Cents, unitsPerPackage: number): string {
  if (!(unitsPerPackage > 0)) {
    throw new RangeError("Aantal per verpakking moet groter zijn dan 0");
  }
  return unitPriceFormat.format(packagePrice / unitsPerPackage / 100);
}

/** Highest percentage the database allows (margin_bp up to 100000 = 1000%). */
const MAX_BASIS_POINTS = 100_000;

/**
 * Parses a percentage as typed in a form field: "15", "12,5" or "12.25" (at most 2
 * decimals), into basis points. Returns null for anything else, or above 1000%.
 */
export function parsePercentage(input: string): BasisPoints | null {
  const match = /^(\d{1,4})(?:[,.](\d{1,2}))?%?$/.exec(input.replace(/\s/g, ""));
  if (!match) {
    return null;
  }
  const [, whole = "", fraction = ""] = match;
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return value <= MAX_BASIS_POINTS ? value : null;
}

/** Basis points as typed in a form field, e.g. 1250 → "12,5". {@link parsePercentage} reads it back. */
export function formatPercentageInput(rate: BasisPoints): string {
  const whole = Math.trunc(rate / 100);
  const fraction = String(rate % 100)
    .padStart(2, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole},${fraction}` : String(whole);
}

/** Basis points for display, e.g. 1250 → "12,5%". */
export function formatPercentage(rate: BasisPoints): string {
  return `${formatPercentageInput(rate)}%`;
}
