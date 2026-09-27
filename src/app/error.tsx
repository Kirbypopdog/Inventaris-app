"use client";

import { useEffect } from "react";
import { primaryButtonClass } from "@/components/form";

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
        <p className="text-lg text-stone-600 dark:text-stone-400">
          De gegevens konden niet geladen worden. Controleer je internetverbinding en probeer
          opnieuw.
        </p>
        {error.digest && (
          <p className="text-sm text-stone-500">Foutcode voor de beheerder: {error.digest}</p>
        )}
      </div>
      <button type="button" onClick={() => retry()} className={primaryButtonClass}>
        Opnieuw proberen
      </button>
    </main>
  );
}
