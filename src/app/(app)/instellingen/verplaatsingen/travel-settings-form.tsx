"use client";

import { useActionState } from "react";
import { FormMessage, choiceClass, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { TRAVEL_METHOD_LABELS, type TravelMethod } from "@/lib/labels";
import { saveTravelSettings } from "./actions";

export type TravelSettingsValues = { method: TravelMethod; kmRate: string; tripFlat: string };

export function TravelSettingsForm({ settings }: { settings: TravelSettingsValues }) {
  const [state, formAction, pending] = useActionState(saveTravelSettings, idleFormState);
  const values =
    state.status === "error" && state.values ? { ...settings, ...state.values } : settings;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-medium">Hoe reken je verplaatsingen aan?</legend>
        {(Object.keys(TRAVEL_METHOD_LABELS) as TravelMethod[]).map((method) => (
          <label key={method} className={choiceClass}>
            <input
              type="radio"
              name="method"
              value={method}
              defaultChecked={values.method === method}
              className="size-5"
            />
            {TRAVEL_METHOD_LABELS[method]}
          </label>
        ))}
      </fieldset>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Bedrag per km</span>
          <input
            name="kmRate"
            required
            inputMode="decimal"
            defaultValue={values.kmRate}
            placeholder="0,43"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Bedrag per rit</span>
          <input
            name="tripFlat"
            required
            inputMode="decimal"
            defaultValue={values.tripFlat}
            placeholder="25,00"
            autoComplete="off"
            className={inputClass}
          />
        </label>
      </div>
      <p className="-mt-2 text-sm text-stone-500">
        Bedragen excl. btw. Het bedrag per km geldt bij &quot;Per km&quot;, het bedrag per rit bij
        &quot;Vast bedrag per rit&quot;.
      </p>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : "Opslaan"}
      </button>
    </form>
  );
}
