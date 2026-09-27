import { formatQuantity } from "@/lib/quantity";

export type OrderItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  supplier: string | null;
  jobTitle: string | null;
  ordered: boolean;
};

export type SupplierGroup = { supplier: string | null; items: OrderItem[] };

/**
 * Items per supplier, suppliers in alphabetical order (ignoring case), items without a
 * supplier last. Items keep their order within a supplier.
 */
export function groupBySupplier(items: readonly OrderItem[]): SupplierGroup[] {
  const groups = new Map<string, SupplierGroup>();
  for (const item of items) {
    // Same supplier, written a bit differently ("vandamme ", "Vandamme"), is one group.
    const key = item.supplier?.trim().toLocaleLowerCase("nl-BE") ?? "";
    const group = groups.get(key);
    if (group) {
      group.items.push(item);
    } else {
      groups.set(key, { supplier: item.supplier?.trim() ?? null, items: [item] });
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, "nl-BE")))
    .map(([, group]) => group);
}

/** One line per item, to paste in a message or mail to the supplier: "12 stuk Scharnier Blum". */
export function orderText(items: readonly OrderItem[]): string {
  return items
    .map((item) => `${formatQuantity(item.quantity)} ${item.unit} ${item.description}`)
    .join("\n");
}
