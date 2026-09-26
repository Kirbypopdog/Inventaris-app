import { cents, formatEuro, formatUnitPrice } from "@/lib/money";
import { formatQuantity } from "@/lib/quantity";

export type PackagePrice = { packagePriceCents: number; unitsPerPackage: number; unit: string };

/** "€ 12,50 per 200 stuk · € 0,0625 per stuk", or "€ 9,00 per stuk" for a single item. */
export function describePrice({ packagePriceCents, unitsPerPackage, unit }: PackagePrice): string {
  const unitPrice = `${formatUnitPrice(cents(packagePriceCents), unitsPerPackage)} per ${unit}`;
  if (unitsPerPackage === 1) {
    return unitPrice;
  }
  const packagePrice = formatEuro(cents(packagePriceCents));
  return `${packagePrice} per ${formatQuantity(unitsPerPackage)} ${unit} · ${unitPrice}`;
}
