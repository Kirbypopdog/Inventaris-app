"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { email: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">E-mailadres</span>
        <input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Wachtwoord</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>
      {state.error && <FormMessage status="error" message={state.error} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met aanmelden…" : "Aanmelden"}
      </button>
      <p className="text-base text-stone-600 dark:text-stone-400">
        Wachtwoord vergeten? Vraag de beheerder om een nieuw tijdelijk wachtwoord.
      </p>
    </form>
  );
}
