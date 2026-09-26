"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { APP_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/schemas";
import { addMember, type FormState } from "./actions";

const initialState: FormState = { status: "idle" };

export function AddMemberForm() {
  const [state, formAction, pending] = useActionState(addMember, initialState);
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Naam</span>
        <input
          name="displayName"
          required
          autoComplete="off"
          defaultValue={values?.displayName}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">E-mailadres</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          required
          autoComplete="off"
          defaultValue={values?.email}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Rol</span>
        <select name="role" defaultValue={values?.role ?? "owner"} className={inputClass}>
          {APP_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Tijdelijk wachtwoord</span>
        <input
          name="temporaryPassword"
          type="text"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="off"
          spellCheck={false}
          className={inputClass}
        />
        <span className="text-sm text-zinc-500">
          Minstens {MIN_PASSWORD_LENGTH} tekens. Geef het persoonlijk door; bij het eerste aanmelden
          kiest de nieuwe gebruiker een eigen wachtwoord.
        </span>
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met toevoegen…" : "Gebruiker toevoegen"}
      </button>
    </form>
  );
}
