"use client";

import { useActionState } from "react";
import { addTrip, updateTrip } from "@/app/(app)/ritten/actions";
import {
  FormMessage,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form";
import { idleFormState } from "@/lib/forms";

export type TripFormValues = {
  id?: string;
  jobId: string;
  tripDate: string;
  distance: string;
  note: string;
};

/** Add a trip (no id) or correct one (with id). The distance is only asked for trips per km. */
export function TripForm({ trip, perKm }: { trip: TripFormValues; perKm: boolean }) {
  const [state, formAction, pending] = useActionState(
    trip.id ? updateTrip : addTrip,
    idleFormState,
  );
  const values = state.status === "error" && state.values ? { ...trip, ...state.values } : trip;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {trip.id && <input type="hidden" name="id" value={trip.id} />}
      <input type="hidden" name="jobId" value={trip.jobId} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Datum</span>
          <input
            type="date"
            name="tripDate"
            required
            defaultValue={values.tripDate}
            className={inputClass}
          />
        </label>
        {perKm ? (
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium">Afstand (km)</span>
            <input
              name="distance"
              required
              inputMode="decimal"
              defaultValue={values.distance}
              placeholder="42"
              autoComplete="off"
              className={inputClass}
            />
          </label>
        ) : (
          <input type="hidden" name="distance" value="" />
        )}
      </div>
      {perKm && <p className="-mt-1 text-sm text-zinc-500">Heen en terug samen.</p>}
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Notitie</span>
        <input name="note" defaultValue={values.note} autoComplete="off" className={inputClass} />
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button
        type="submit"
        disabled={pending}
        className={trip.id ? secondaryButtonClass : primaryButtonClass}
      >
        {pending ? "Bezig met opslaan…" : trip.id ? "Aanpassing opslaan" : "Rit toevoegen"}
      </button>
    </form>
  );
}
