import { add, cents, partOfPackage, type Cents } from "@/lib/money";

export type PricedUsage = {
  packagePriceCents: number;
  unitsPerPackage: number;
  quantity: number;
};

/** Cost of one entry: the price of the used part of the package, rounded once. */
export function usageCost(usage: PricedUsage): Cents {
  return partOfPackage(cents(usage.packagePriceCents), usage.unitsPerPackage, usage.quantity);
}

/** Total cost of several entries: each entry is rounded once, then summed. */
export function sumUsages(usages: readonly PricedUsage[]): Cents {
  return add(...usages.map(usageCost));
}
