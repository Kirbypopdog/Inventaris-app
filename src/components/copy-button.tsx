"use client";

import { useState } from "react";

/** Copies a text (e.g. an order for a supplier) to paste in a message or mail. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch (error) {
      // No clipboard access (old browser, or permission refused): say so instead of failing silently.
      console.error("Copying failed", error);
      setStatus("failed");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-stone-300 bg-white px-3 text-base font-medium whitespace-nowrap hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900"
    >
      {status === "copied" ? "Gekopieerd" : status === "failed" ? "Kopiëren lukt niet" : label}
    </button>
  );
}
