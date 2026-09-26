"use client";

import { useActionState } from "react";
import { saveTimeEntry } from "@/app/(app)/uren/actions";
import { FormMessage, inputClass, secondaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";

export type TimeEntryFormValues = {
  id?: string;
  jobId: string;
  date: string;
  from: string;
  until: string;
  note: string;
};

/** Add hours by hand, or correct an entry (for example a forgotten clock-out). */
export function TimeEntryForm({ entry }: { entry: TimeEntryFormValues }) {
  const [state, formAction, pending] = useActionState(saveTimeEntry, idleFormState);
  const values = state.status === "error" && state.values ? { ...entry, ...state.values } : entry;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {entry.id && <input type="hidden" name="id" value={entry.id} />}
      <input type="hidden" name="jobId" value={entry.jobId} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_8rem_8rem]">
        <label className="col-span-2 flex flex-col gap-2 md:col-span-1">
          <span className="text-base font-medium">Datum</span>
          <input
            type="date"
            name="date"
            required
            defaultValue={values.date}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Van</span>
          <input
            type="time"
            name="from"
            required
            defaultValue={values.from}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Tot</span>
          <input
            type="time"
            name="until"
            required
            defaultValue={values.until}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Notitie</span>
        <input name="note" defaultValue={values.note} autoComplete="off" className={inputClass} />
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={secondaryButtonClass}>
        {pending ? "Bezig met opslaan…" : entry.id ? "Aanpassing opslaan" : "Uren toevoegen"}
      </button>
    </form>
  );
}
