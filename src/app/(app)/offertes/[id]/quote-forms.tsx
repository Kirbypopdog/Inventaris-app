"use client";

import { useActionState } from "react";
import {
  FormMessage,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { saveQuoteDetails, saveQuoteLine } from "../actions";

export type QuoteDetailsValues = {
  id: string;
  quoteDate: string;
  validUntil: string;
  intro: string;
  notes: string;
};

export function QuoteDetailsForm({ quote }: { quote: QuoteDetailsValues }) {
  const [state, formAction, pending] = useActionState(saveQuoteDetails, idleFormState);
  const values = state.status === "error" && state.values ? { ...quote, ...state.values } : quote;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={quote.id} />
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Datum</span>
          <input
            type="date"
            name="quoteDate"
            required
            defaultValue={values.quoteDate}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Geldig tot</span>
          <input
            type="date"
            name="validUntil"
            defaultValue={values.validUntil}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Inleiding</span>
        <textarea
          name="intro"
          rows={3}
          defaultValue={values.intro}
          placeholder="bv. Zoals besproken op de werf, hierbij onze prijs voor…"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Voorwaarden en opmerkingen</span>
        <textarea name="notes" rows={3} defaultValue={values.notes} className={inputClass} />
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={secondaryButtonClass}>
        {pending ? "Bezig met opslaan…" : "Opslaan"}
      </button>
    </form>
  );
}

export type QuoteLineValues = {
  id?: string;
  quoteId: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
};

const VAT_OPTIONS = ["21", "6", "12", "0"] as const;

/** Add a line (no id) or correct one (with id). */
export function QuoteLineForm({ line }: { line: QuoteLineValues }) {
  const [state, formAction, pending] = useActionState(saveQuoteLine, idleFormState);
  const values = state.status === "error" && state.values ? { ...line, ...state.values } : line;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {line.id && <input type="hidden" name="id" value={line.id} />}
      <input type="hidden" name="quoteId" value={line.quoteId} />
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Omschrijving</span>
        <textarea
          name="description"
          required
          rows={2}
          defaultValue={values.description}
          placeholder="bv. Maatwerk keukenkasten in eik, geplaatst"
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Aantal</span>
          <input
            name="quantity"
            required
            inputMode="decimal"
            defaultValue={values.quantity}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Eenheid</span>
          <input
            name="unit"
            required
            list="quote-units"
            defaultValue={values.unit}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Prijs per eenheid</span>
          <input
            name="unitPrice"
            required
            inputMode="decimal"
            defaultValue={values.unitPrice}
            placeholder="0,00"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Btw</span>
          <select name="vatRate" defaultValue={values.vatRate} className={inputClass}>
            {VAT_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate}%
              </option>
            ))}
          </select>
        </label>
      </div>
      <datalist id="quote-units">
        {["stuk", "uur", "m", "m²", "forfait", "plaat"].map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
      <p className="-mt-1 text-sm text-zinc-500">Prijs excl. btw.</p>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button
        type="submit"
        disabled={pending}
        className={line.id ? secondaryButtonClass : primaryButtonClass}
      >
        {pending ? "Bezig met opslaan…" : line.id ? "Regel opslaan" : "Regel toevoegen"}
      </button>
    </form>
  );
}
