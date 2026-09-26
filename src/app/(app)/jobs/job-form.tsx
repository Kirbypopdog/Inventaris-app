"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/labels";
import { saveJob } from "./actions";

export type JobFormValues = {
  id?: string;
  customerId: string;
  title: string;
  description: string;
  addressLine: string;
  postalCode: string;
  city: string;
  status: JobStatus;
  startsOn: string;
  endsOn: string;
};

export type CustomerOption = { id: string; name: string };

export function JobForm({ job, customers }: { job: JobFormValues; customers: CustomerOption[] }) {
  const [state, formAction, pending] = useActionState(saveJob, idleFormState);
  const values = state.status === "error" && state.values ? { ...job, ...state.values } : job;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {job.id && <input type="hidden" name="id" value={job.id} />}

      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Klant</span>
        <select name="customerId" required defaultValue={values.customerId} className={inputClass}>
          <option value="" disabled>
            Kies een klant
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Naam van de job</span>
        <input
          name="title"
          required
          defaultValue={values.title}
          placeholder="bv. Keuken Assebroek"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Omschrijving</span>
        <textarea
          name="description"
          rows={4}
          defaultValue={values.description}
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-medium">
          Adres van de werf{" "}
          <span className="font-normal text-zinc-500">(leeg = adres van de klant)</span>
        </legend>
        <input
          name="addressLine"
          aria-label="Adres van de werf"
          defaultValue={values.addressLine}
          placeholder="Straat en nummer"
          autoComplete="off"
          className={inputClass}
        />
        <div className="grid grid-cols-[8rem_1fr] gap-4">
          <input
            name="postalCode"
            aria-label="Postcode van de werf"
            inputMode="numeric"
            defaultValue={values.postalCode}
            placeholder="Postcode"
            autoComplete="off"
            className={inputClass}
          />
          <input
            name="city"
            aria-label="Gemeente van de werf"
            defaultValue={values.city}
            placeholder="Gemeente"
            autoComplete="off"
            className={inputClass}
          />
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Status</span>
          <select name="status" defaultValue={values.status} className={inputClass}>
            {(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((status) => (
              <option key={status} value={status}>
                {JOB_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Start</span>
          <input
            type="date"
            name="startsOn"
            defaultValue={values.startsOn}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Einde</span>
          <input type="date" name="endsOn" defaultValue={values.endsOn} className={inputClass} />
        </label>
      </div>

      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : job.id ? "Opslaan" : "Job aanmaken"}
      </button>
    </form>
  );
}
