"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { saveGeneralMargin } from "./actions";

export function MarginForm({ margin }: { margin: string }) {
  const [state, formAction, pending] = useActionState(saveGeneralMargin, idleFormState);
  const value = state.status === "error" && state.values ? state.values.margin : margin;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Marge op materiaal (%)</span>
        <input
          name="margin"
          required
          inputMode="decimal"
          defaultValue={value}
          placeholder="15"
          autoComplete="off"
          className={inputClass}
        />
        <span className="text-sm text-zinc-500">
          Komt bovenop de aankoopprijs op offertes en facturen. 0 = geen marge.
        </span>
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : "Opslaan"}
      </button>
    </form>
  );
}
