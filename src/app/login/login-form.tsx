"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { step: "email", email: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  if (state.step === "email") {
    return (
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="intent" value="request" />
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">E-mailadres</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={state.email}
            className={inputClass}
          />
        </label>
        {state.error && <FormMessage status="error" message={state.error} />}
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Code wordt verstuurd…" : "Stuur mij een code"}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="intent" value="verify" />
        <input type="hidden" name="email" value={state.email} />
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          We stuurden een code naar <strong>{state.email}</strong>.
        </p>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Code</span>
          <input
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            required
            autoFocus
            className={`${inputClass} tracking-[0.3em]`}
          />
        </label>
        {state.error && <FormMessage status="error" message={state.error} />}
        <button type="submit" disabled={pending} className={primaryButtonClass}>
          {pending ? "Bezig met aanmelden…" : "Aanmelden"}
        </button>
      </form>
      <form action={formAction}>
        <input type="hidden" name="intent" value="restart" />
        <input type="hidden" name="email" value={state.email} />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full text-base text-zinc-600 underline dark:text-zinc-400"
        >
          Ander e-mailadres of nieuwe code
        </button>
      </form>
    </div>
  );
}
