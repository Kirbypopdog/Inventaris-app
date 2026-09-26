"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
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
          <label
            key={method}
            className="flex min-h-14 items-center gap-3 rounded-xl border border-zinc-300 px-4 text-lg has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-100 dark:border-zinc-700 dark:has-[:checked]:border-zinc-50 dark:has-[:checked]:bg-zinc-800"
          >
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
      <p className="-mt-2 text-sm text-zinc-500">
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
