"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { CUSTOMER_TYPE_LABELS, type CustomerType } from "@/lib/labels";
import { saveCustomer } from "./actions";

export type CustomerFormValues = {
  id?: string;
  type: CustomerType;
  name: string;
  vatNumber: string;
  email: string;
  phone: string;
  addressLine: string;
  postalCode: string;
  city: string;
  notes: string;
};

export const emptyCustomer: CustomerFormValues = {
  type: "private",
  name: "",
  vatNumber: "",
  email: "",
  phone: "",
  addressLine: "",
  postalCode: "",
  city: "",
  notes: "",
};

function TextField({
  label,
  name,
  defaultValue,
  hint,
  ...props
}: {
  label: string;
  name: string;
  defaultValue: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-medium">{label}</span>
      <input name={name} defaultValue={defaultValue} className={inputClass} {...props} />
      {hint && <span className="text-sm text-zinc-500">{hint}</span>}
    </label>
  );
}

export function CustomerForm({ customer }: { customer: CustomerFormValues }) {
  const [state, formAction, pending] = useActionState(saveCustomer, idleFormState);
  // After an error, show what was filled in; otherwise the saved values.
  const values =
    state.status === "error" && state.values ? { ...customer, ...state.values } : customer;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {customer.id && <input type="hidden" name="id" value={customer.id} />}

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Soort klant</legend>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map((type) => (
            <label
              key={type}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-zinc-300 px-4 text-lg has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-100 dark:border-zinc-700 dark:has-[:checked]:border-zinc-50 dark:has-[:checked]:bg-zinc-800"
            >
              <input
                type="radio"
                name="type"
                value={type}
                defaultChecked={values.type === type}
                className="size-5"
              />
              {CUSTOMER_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <TextField label="Naam" name="name" defaultValue={values.name} required autoComplete="off" />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Telefoon"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={values.phone}
          autoComplete="off"
        />
        <TextField
          label="E-mailadres"
          name="email"
          type="email"
          inputMode="email"
          defaultValue={values.email}
          autoComplete="off"
        />
      </div>
      <TextField
        label="Adres"
        name="addressLine"
        defaultValue={values.addressLine}
        placeholder="Straat en nummer"
        autoComplete="off"
      />
      <div className="grid grid-cols-[8rem_1fr] gap-4">
        <TextField
          label="Postcode"
          name="postalCode"
          inputMode="numeric"
          defaultValue={values.postalCode}
          autoComplete="off"
        />
        <TextField label="Gemeente" name="city" defaultValue={values.city} autoComplete="off" />
      </div>
      <TextField
        label="Btw-nummer"
        name="vatNumber"
        defaultValue={values.vatNumber}
        placeholder="BE 0123.456.749"
        hint="Enkel voor bedrijven. Wordt gecontroleerd op tikfouten."
        autoComplete="off"
      />
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Notities</span>
        <textarea name="notes" rows={3} defaultValue={values.notes} className={inputClass} />
      </label>

      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : customer.id ? "Opslaan" : "Klant toevoegen"}
      </button>
    </form>
  );
}
