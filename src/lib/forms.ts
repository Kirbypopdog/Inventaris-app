import { z } from "zod";

/** Result of a form action, shown by the form with useActionState. */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  // values: what was filled in, so the form can show it again after an error.
  | { status: "error"; message: string; values?: Record<string, string> };

export const idleFormState: FormState = { status: "idle" };

export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** All string fields of a form, to show them again after an error. Never includes passwords. */
export function formValues(formData: FormData, names: readonly string[]): Record<string, string> {
  return Object.fromEntries(names.map((name) => [name, field(formData, name)]));
}

export function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Controleer de ingevulde gegevens.";
}

/** Optional text field: trimmed, empty becomes null. */
export function optionalText(max: number, tooLong: string) {
  return z
    .string()
    .trim()
    .max(max, { error: tooLong })
    .transform((value) => (value === "" ? null : value));
}
