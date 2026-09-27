"use client";

import { useOptimistic, useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import type { FormState } from "@/lib/forms";

export type ChecklistItem = { id: string; title: string; detail?: string | null; done: boolean };

/**
 * Items with a big checkbox each (tasks, things to order). Ticking shows at once; the server
 * action `toggle` catches up in the background and the page then moves the item to the right
 * list.
 */
export function Checklist({
  items,
  label,
  toggle,
}: {
  items: ChecklistItem[];
  label: string;
  toggle: (id: string, done: boolean) => Promise<FormState>;
}) {
  const [shown, setShown] = useOptimistic(items, (current, update: { id: string; done: boolean }) =>
    current.map((item) => (item.id === update.id ? { ...item, done: update.done } : item)),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function change(id: string, done: boolean) {
    startTransition(async () => {
      setShown({ id, done });
      const result = await toggle(id, done);
      setError(result.status === "error" ? result.message : null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul
        aria-label={label}
        className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
      >
        {shown.map((item) => (
          <li key={item.id}>
            <label className="accent-brand-700 dark:accent-brand-400 flex min-h-14 cursor-pointer items-center gap-4 px-4 py-2 text-lg">
              <input
                type="checkbox"
                checked={item.done}
                onChange={(event) => change(item.id, event.target.checked)}
                className="size-6 shrink-0"
              />
              <span className="flex min-w-0 flex-col">
                <span
                  className={`break-words ${
                    item.done ? "text-stone-500 line-through dark:text-stone-500" : ""
                  }`}
                >
                  {item.title}
                </span>
                {item.detail && (
                  <span className="text-base text-stone-600 dark:text-stone-400">
                    {item.detail}
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error && <FormMessage status="error" message={error} />}
    </div>
  );
}
