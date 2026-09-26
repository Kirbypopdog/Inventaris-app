export const inputClass =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-4 text-lg text-zinc-900 " +
  "focus:border-zinc-900 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-500 " +
  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:disabled:bg-zinc-800";

export const primaryButtonClass =
  "min-h-14 w-full rounded-xl bg-zinc-900 px-4 text-lg font-semibold text-white " +
  "disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900";

export const secondaryButtonClass =
  "min-h-14 w-full rounded-xl border border-zinc-300 px-4 text-lg font-medium " +
  "disabled:opacity-60 dark:border-zinc-700";

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
