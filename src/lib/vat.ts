import { z } from "zod";
import { isVatRate, type VatRate } from "@/lib/money";

const MESSAGE = "Kies een btw-tarief: 0, 6, 12 of 21%.";

function toVatRate(value: string): VatRate {
  const rate = Number(value);
  if (!isVatRate(rate)) {
    throw new RangeError(`Onbekend btw-tarief: ${value}`);
  }
  return rate;
}

/** A VAT rate from a form field, read strictly: an empty field never silently becomes 0%. */
export const vatRateSchema = z
  .enum(["0", "6", "12", "21"], { error: MESSAGE })
  .transform(toVatRate);

/** An optional VAT rate: empty means "no exception", the next level applies. */
export const optionalVatRateSchema = z
  .enum(["", "0", "6", "12", "21"], { error: MESSAGE })
  .transform((value) => (value === "" ? null : toVatRate(value)));
