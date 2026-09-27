"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { saveCompany } from "./actions";

export type CompanyFormValues = {
  companyName: string;
  vatNumber: string;
  addressLine: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  iban: string;
  quoteValidityDays: string;
};

function TextField({
  label,
  name,
  defaultValue,
  hint,
  ...props
}: {
  label: string;
  name: keyof CompanyFormValues;
  defaultValue: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-medium">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        autoComplete="off"
        className={inputClass}
        {...props}
      />
      {hint && <span className="text-sm text-zinc-500">{hint}</span>}
    </label>
  );
}

export function CompanyForm({ company }: { company: CompanyFormValues }) {
  const [state, formAction, pending] = useActionState(saveCompany, idleFormState);
  const values =
    state.status === "error" && state.values ? { ...company, ...state.values } : company;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        label="Bedrijfsnaam"
        name="companyName"
        defaultValue={values.companyName}
        required
      />
      <TextField
        label="Btw-nummer"
        name="vatNumber"
        defaultValue={values.vatNumber}
        placeholder="BE 0123.456.749"
        hint="Je ondernemingsnummer. Wordt gecontroleerd op tikfouten."
      />
      <TextField
        label="Adres"
        name="addressLine"
        defaultValue={values.addressLine}
        placeholder="Straat en nummer"
      />
      <div className="grid grid-cols-[8rem_1fr] gap-4">
        <TextField
          label="Postcode"
          name="postalCode"
          inputMode="numeric"
          defaultValue={values.postalCode}
        />
        <TextField label="Gemeente" name="city" defaultValue={values.city} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Telefoon"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={values.phone}
        />
        <TextField
          label="E-mailadres"
          name="email"
          type="email"
          inputMode="email"
          defaultValue={values.email}
        />
      </div>
      <TextField
        label="Rekeningnummer (IBAN)"
        name="iban"
        defaultValue={values.iban}
        placeholder="BE68 5390 0754 7034"
        hint="Komt op facturen, zodat klanten weten waarheen ze betalen."
      />
      <TextField
        label="Offerte geldig (dagen)"
        name="quoteValidityDays"
        inputMode="numeric"
        defaultValue={values.quoteValidityDays}
        required
        hint="Een nieuwe offerte is standaard zo lang geldig. Per offerte aanpasbaar."
      />
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : "Opslaan"}
      </button>
    </form>
  );
}
