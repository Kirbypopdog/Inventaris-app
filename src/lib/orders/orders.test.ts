import { describe, expect, it } from "vitest";
import { type OrderItem, groupBySupplier, orderText } from "./group";
import { orderItemRow, orderItemSchema } from "./schemas";

const item = (id: string, supplier: string | null, extra: Partial<OrderItem> = {}): OrderItem => ({
  id,
  description: `Item ${id}`,
  quantity: 1,
  unit: "stuk",
  supplier,
  jobTitle: null,
  ordered: false,
  ...extra,
});

describe("groupBySupplier", () => {
  it("groups per supplier, alphabetically, without a supplier last", () => {
    const groups = groupBySupplier([
      item("1", null),
      item("2", "Vandamme"),
      item("3", "Aertssen"),
      item("4", "vandamme "),
    ]);
    expect(groups.map((group) => group.supplier)).toEqual(["Aertssen", "Vandamme", null]);
    expect(groups[1]?.items.map((i) => i.id)).toEqual(["2", "4"]);
  });

  it("is empty for no items", () => {
    expect(groupBySupplier([])).toEqual([]);
  });
});

describe("orderText", () => {
  it("makes one line per item", () => {
    expect(
      orderText([
        item("1", "V", { description: "Scharnier Blum", quantity: 12 }),
        item("2", "V", { description: "Multiplex 18 mm", quantity: 2.5, unit: "plaat" }),
      ]),
    ).toBe("12 stuk Scharnier Blum\n2,5 plaat Multiplex 18 mm");
  });
});

describe("orderItemSchema", () => {
  const valid = {
    materialId: "",
    jobId: "",
    description: " Silicone ",
    quantity: "3",
    unit: "koker",
    supplier: " ",
  };

  it("allows no material, no job and no supplier", () => {
    expect(orderItemRow(orderItemSchema.parse(valid))).toEqual({
      material_id: null,
      job_id: null,
      description: "Silicone",
      quantity: 3,
      unit: "koker",
      supplier: null,
    });
  });

  it("refuses a wrong quantity or id", () => {
    expect(orderItemSchema.safeParse({ ...valid, quantity: "0" }).success).toBe(false);
    expect(orderItemSchema.safeParse({ ...valid, quantity: "twee" }).success).toBe(false);
    expect(orderItemSchema.safeParse({ ...valid, jobId: "keuken" }).success).toBe(false);
  });
});
