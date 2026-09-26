"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form";
import { idleFormState, type FormState } from "@/lib/forms";

/** A single button that runs a server action with fixed values, and shows the result. */
export function ActionButton({
  action,
  values,
  label,
  pendingLabel,
  className,
  confirm,
}: {
  action: (previous: FormState, formData: FormData) => Promise<FormState>;
  values: Record<string, string>;
  label: string;
  pendingLabel: string;
  className: string;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleFormState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) {
          event.preventDefault();
        }
      }}
    >
      {Object.entries(values).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" disabled={pending} className={className}>
        {pending ? pendingLabel : label}
      </button>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
    </form>
  );
}
