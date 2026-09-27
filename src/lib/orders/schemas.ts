import { z } from "zod";
import { optionalText } from "@/lib/forms";
import { parseQuantity } from "@/lib/quantity";

export const ORDER_ITEM_FIELDS = [
  "materialId",
  "jobId",
  "description",
  "quantity",
  "unit",
  "supplier",
] as const;

/** Empty select means "none". */
const optionalId = (message: string) =>
  z
    .string()
    .transform((value) => (value === "" ? null : value))
    .pipe(z.uuid({ error: message }).nullable());

/** Something to order: from the catalogue or not, for a job or not. */
export const orderItemSchema = z.object({
  materialId: optionalId("Onbekend materiaal."),
  jobId: optionalId("Onbekende job."),
  description: z
    .string()
    .trim()
    .min(1, { error: "Schrijf wat er besteld moet worden." })
    .max(200, { error: "De omschrijving is te lang (maximaal 200 tekens)." }),
  quantity: z.string().transform((value, context) => {
    const quantity = parseQuantity(value);
    if (quantity === null) {
      context.addIssue({ code: "custom", message: "Geef een aantal in, bv. 12 of 2,5." });
      return z.NEVER;
    }
    return quantity;
  }),
  unit: z
    .string()
    .trim()
    .min(1, { error: "Geef een eenheid in, bv. stuk, doos of plaat." })
    .max(30, { error: "De eenheid is te lang." }),
  supplier: optionalText(200, "De naam van de leverancier is te lang."),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

export function orderItemRow(input: OrderItemInput) {
  return {
    material_id: input.materialId,
    job_id: input.jobId,
    description: input.description,
    quantity: input.quantity,
    unit: input.unit,
    supplier: input.supplier,
  };
}

/** Ticking an item off as ordered, or back to open. */
export const orderedSchema = z.object({ id: z.uuid(), ordered: z.boolean() });
