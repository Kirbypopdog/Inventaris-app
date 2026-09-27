"use client";

import { useActionState } from "react";
import { addMeasurement, updateMeasurement } from "../measurement-actions";
import {
  FormMessage,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form";
import { idleFormState } from "@/lib/forms";

export type MeasurementFormValues = {
  id?: string;
  jobId: string;
  label: string;
  width: string;
  height: string;
  depth: string;
  note: string;
};

const SIZES = [
  { name: "width", label: "Breedte" },
  { name: "height", label: "Hoogte" },
  { name: "depth", label: "Diepte" },
] as const;

/** Add a measurement (no id) or correct one (with id). Sizes in whole mm, at least one. */
export function MeasurementForm({ measurement }: { measurement: MeasurementFormValues }) {
  const [state, formAction, pending] = useActionState(
    measurement.id ? updateMeasurement : addMeasurement,
    idleFormState,
  );
  const values =
    state.status === "error" && state.values ? { ...measurement, ...state.values } : measurement;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {measurement.id && <input type="hidden" name="id" value={measurement.id} />}
      <input type="hidden" name="jobId" value={measurement.jobId} />
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Wat</span>
        <input
          name="label"
          required
          maxLength={200}
          defaultValue={values.label}
          placeholder="bv. Kast hal"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Maten in mm</legend>
        <div className="grid grid-cols-3 gap-2">
          {SIZES.map((size) => (
            <label key={size.name} className="flex min-w-0 flex-col gap-1">
              <span className="text-sm text-stone-600 dark:text-stone-400">{size.label}</span>
              <input
                name={size.name}
                inputMode="numeric"
                defaultValue={values[size.name]}
                autoComplete="off"
                className={`${inputClass} px-3 tabular-nums`}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Notitie</span>
        <input
          name="note"
          maxLength={1000}
          defaultValue={values.note}
          autoComplete="off"
          className={inputClass}
        />
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button
        type="submit"
        disabled={pending}
        className={measurement.id ? secondaryButtonClass : primaryButtonClass}
      >
        {pending
          ? "Bezig met opslaan…"
          : measurement.id
            ? "Aanpassing opslaan"
            : "Opmeting bewaren"}
      </button>
    </form>
  );
}
