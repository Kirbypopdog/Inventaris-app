import { z } from "zod";
import { optionalText } from "@/lib/forms";
import { parseEuro } from "@/lib/money";
import { parseQuantity } from "@/lib/quantity";

const nameSchema = (empty: string) =>
  z.string().trim().min(1, { error: empty }).max(200, { error: "De naam is te lang." });

const unitSchema = z
  .string()
  .trim()
  .min(1, { error: "Geef een eenheid in, bv. stuk, m of plaat." })
  .max(30, { error: "De eenheid is te lang." });

const priceSchema = (message: string) =>
  z.string().transform((value, context) => {
    const amount = parseEuro(value);
    if (amount === null || amount < 0) {
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return amount;
  });

const quantitySchema = (message: string) =>
  z.string().transform((value, context) => {
    const quantity = parseQuantity(value);
    if (quantity === null) {
      context.addIssue({ code: "custom", message });
      return z.NEVER;
    }
    return quantity;
  });

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Geef een datum in." });

export const MATERIAL_FIELDS = [
  "name",
  "unit",
  "packagePrice",
  "unitsPerPackage",
  "supplier",
] as const;

/** A material in the catalogue: the price of a package and how many units are in it. */
export const materialSchema = z.object({
  name: nameSchema("Geef het materiaal een naam, bv. 'Vijzen 4x40'."),
  unit: unitSchema,
  packagePrice: priceSchema("Geef de prijs van de verpakking in, bv. 12,50."),
  unitsPerPackage: quantitySchema("Geef in hoeveel er in één verpakking zit, bv. 200 of 1."),
  supplier: optionalText(200, "De naam van de leverancier is te lang."),
});

export type MaterialInput = z.infer<typeof materialSchema>;

/** Maps validated input to the columns of public.materials. */
export function materialRow(input: MaterialInput) {
  return {
    name: input.name,
    unit: input.unit,
    package_price_cents: input.packagePrice,
    units_per_package: input.unitsPerPackage,
    supplier: input.supplier,
  };
}

export const USAGE_COUNTS = ["unit", "package"] as const;

export const CATALOG_USAGE_FIELDS = ["jobId", "materialId", "quantity", "per", "usedOn"] as const;

/** Material from the catalogue on a job, counted in units or in whole packages. */
export const catalogUsageSchema = z.object({
  jobId: z.uuid({ error: "Onbekende job." }),
  materialId: z.uuid({ error: "Kies een materiaal." }),
  quantity: quantitySchema("Geef een aantal in, bv. 35 of 2,5."),
  per: z.enum(USAGE_COUNTS, { error: "Kies per stuk of per verpakking." }),
  usedOn: dateSchema,
});

export const OTHER_USAGE_FIELDS = [
  "jobId",
  "description",
  "quantity",
  "unit",
  "unitPrice",
  "usedOn",
] as const;

/** Something that is not in the catalogue, e.g. a panel bought once for this job. */
export const otherUsageSchema = z.object({
  jobId: z.uuid({ error: "Onbekende job." }),
  description: nameSchema("Geef een omschrijving in."),
  quantity: quantitySchema("Geef een aantal in, bv. 1 of 2,5."),
  unit: unitSchema,
  unitPrice: priceSchema("Geef de prijs per eenheid in, bv. 18,99."),
  usedOn: dateSchema,
});

export const USAGE_UPDATE_FIELDS = ["quantity", "usedOn"] as const;

/** Correcting an entry: only the quantity (in units) and the date. */
export const usageUpdateSchema = z.object({
  quantity: quantitySchema("Geef een aantal in, bv. 35 of 2,5."),
  usedOn: dateSchema,
});
