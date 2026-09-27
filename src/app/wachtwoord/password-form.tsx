"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/schemas";
import { changePassword, type PasswordState } from "./actions";

const initialState: PasswordState = {};

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Nieuw wachtwoord</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          className={inputClass}
        />
        <span className="text-sm text-stone-500">Minstens {MIN_PASSWORD_LENGTH} tekens.</span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Herhaal het nieuwe wachtwoord</span>
        <input
          name="confirmation"
          type="password"
          autoComplete="new-password"
          required
          className={inputClass}
        />
      </label>
      {state.error && <FormMessage status="error" message={state.error} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : "Wachtwoord opslaan"}
      </button>
    </form>
  );
}
