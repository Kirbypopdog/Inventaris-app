/**
 * Quantities of material (pieces, metres, boxes) are stored as numeric(12, 3) in the
 * database: at most 3 decimals, below one billion.
 */
const MAX_QUANTITY = 999_999_999.999;

/**
 * Parses what a user types in a quantity field: "35", "2,5", "2.5" or "0,125".
 * Returns null when the input is not a positive number with at most 3 decimals.
 */
export function parseQuantity(input: string): number | null {
  const match = /^(\d+)(?:[,.](\d{1,3}))?$/.exec(input.replace(/\s/g, ""));
  if (!match) {
    return null;
  }
  const [, whole = "", fraction = ""] = match;
  const value = Number(`${whole}.${fraction || "0"}`);
  if (!(value > 0) || value > MAX_QUANTITY) {
    return null;
  }
  return value;
}

const quantityFormat = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 3 });

export function formatQuantity(value: number): string {
  return quantityFormat.format(value);
}

const quantityInputFormat = new Intl.NumberFormat("nl-BE", {
  maximumFractionDigits: 3,
  useGrouping: false,
});

/** A quantity as it is typed in a form field, e.g. "1200" or "2,5". */
export function formatQuantityInput(value: number): string {
  return quantityInputFormat.format(value);
}
