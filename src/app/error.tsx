"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Er ging iets mis</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          De gegevens konden niet geladen worden. Controleer je internetverbinding en probeer
          opnieuw.
        </p>
        {error.digest && (
          <p className="text-sm text-zinc-500">Foutcode voor de beheerder: {error.digest}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-14 w-full rounded-xl bg-zinc-900 px-4 text-lg font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Opnieuw proberen
      </button>
    </main>
  );
}
