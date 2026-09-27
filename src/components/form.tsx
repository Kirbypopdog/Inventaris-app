export const inputClass =
  "w-full rounded-xl border border-stone-300 bg-white px-4 py-4 text-lg text-stone-900 " +
  "focus:border-brand-600 focus:ring-2 focus:ring-brand-200 focus:outline-none " +
  "disabled:bg-stone-100 disabled:text-stone-500 dark:border-stone-700 dark:bg-stone-950 " +
  "dark:text-stone-50 dark:focus:border-brand-400 dark:focus:ring-brand-900 dark:disabled:bg-stone-800";

export const primaryButtonClass =
  "min-h-14 w-full rounded-xl bg-brand-700 px-4 text-lg font-semibold text-white " +
  "hover:bg-brand-800 disabled:opacity-60 dark:bg-brand-400 dark:text-brand-950 dark:hover:bg-brand-300";

export const secondaryButtonClass =
  "min-h-14 w-full rounded-xl border border-stone-300 bg-white px-4 text-lg font-medium " +
  "hover:border-stone-400 disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900";

/**
 * A radio or checkbox wrapped in a big label: the whole card is the tap target and
 * gets the accent colour when checked.
 */
export const choiceClass =
  "flex min-h-14 items-center gap-3 rounded-xl border border-stone-300 bg-white px-4 text-lg " +
  "accent-brand-700 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 " +
  "dark:border-stone-700 dark:bg-stone-950 dark:has-[:checked]:border-brand-400 " +
  "dark:has-[:checked]:bg-brand-950";

/** Clocking in and out: big enough to hit with work gloves on. */
export const clockInButtonClass =
  "min-h-14 w-full rounded-xl bg-brand-700 px-4 text-lg font-semibold text-white " +
  "hover:bg-brand-800 disabled:opacity-60 dark:bg-brand-400 dark:text-brand-950";

export const clockOutButtonClass =
  "min-h-14 w-full rounded-xl bg-red-700 px-4 text-lg font-semibold text-white " +
  "hover:bg-red-800 disabled:opacity-60 dark:bg-red-600";

export const dangerButtonClass =
  "min-h-14 w-full rounded-xl border border-red-300 px-4 text-lg font-medium text-red-700 " +
  "disabled:opacity-60 dark:border-red-800 dark:text-red-300";

export function FormMessage({ status, message }: { status: "success" | "error"; message: string }) {
  return (
    <p
      role={status === "error" ? "alert" : "status"}
      className={
        status === "error"
          ? "rounded-xl bg-red-50 p-4 text-base text-red-800 dark:bg-red-950 dark:text-red-200"
          : "rounded-xl bg-green-50 p-4 text-base text-green-800 dark:bg-green-950 dark:text-green-200"
      }
    >
      {message}
    </p>
  );
}
