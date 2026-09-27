import {
  cents,
  multiply,
  vatBreakdown,
  VAT_RATES,
  type Cents,
  type VatBreakdown,
  type VatRate,
} from "@/lib/money";

export type PricedLine = { quantity: number; unitPriceCents: number; vatRate: number };

export function isVatRate(rate: number): rate is VatRate {
  return (VAT_RATES as readonly number[]).includes(rate);
}

function toVatRate(rate: number): VatRate {
  if (!isVatRate(rate)) {
    throw new RangeError(`Onbekend btw-tarief: ${rate}`);
  }
  return rate;
}

/** Net amount of one line: quantity × unit price, rounded once. */
export function lineNet(line: PricedLine): Cents {
  return multiply(cents(line.unitPriceCents), line.quantity);
}

/** Net, VAT per rate and total of a quote or invoice. */
export function documentTotals(lines: readonly PricedLine[]): VatBreakdown {
  return vatBreakdown(
    lines.map((line) => ({ net: lineNet(line), vatRate: toVatRate(line.vatRate) })),
  );
}
