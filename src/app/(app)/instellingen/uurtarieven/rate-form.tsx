"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { addHourlyRate } from "./actions";

export function RateForm() {
  const [state, formAction, pending] = useActionState(addHourlyRate, idleFormState);
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Naam</span>
        <input
          name="name"
          required
          defaultValue={values?.name}
          placeholder="bv. Werkplaats of Plaatsing"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Bedrag per uur (excl. btw)</span>
        <input
          name="rate"
          required
          inputMode="decimal"
          defaultValue={values?.rate}
          placeholder="45,00"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : "Uurtarief toevoegen"}
      </button>
    </form>
  );
}
