"use client";

import { useOptimistic, useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { TrashIcon } from "@/components/icons";
import type { FormState } from "@/lib/forms";

export type ChecklistItem = { id: string; title: string; detail?: string | null; done: boolean };

type Change = { type: "toggle"; id: string; done: boolean } | { type: "remove"; id: string };

/**
 * Items with a big checkbox each (tasks, things to order) and a button to delete one. Both
 * show at once; the server actions `toggle` and `remove` catch up in the background and the
 * page then moves the item to the right list.
 */
export function Checklist({
  items,
  label,
  toggle,
  remove,
}: {
  items: ChecklistItem[];
  label: string;
  toggle: (id: string, done: boolean) => Promise<FormState>;
  remove: (id: string) => Promise<FormState>;
}) {
  const [shown, apply] = useOptimistic(items, (current, change: Change) =>
    change.type === "remove"
      ? current.filter((item) => item.id !== change.id)
      : current.map((item) => (item.id === change.id ? { ...item, done: change.done } : item)),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(change: Change, action: () => Promise<FormState>) {
    startTransition(async () => {
      apply(change);
      const result = await action();
      setError(result.status === "error" ? result.message : null);
    });
  }

  function onRemove(item: ChecklistItem) {
    if (!window.confirm(`"${item.title}" verwijderen?`)) {
      return;
    }
    run({ type: "remove", id: item.id }, () => remove(item.id));
  }

  return (
    <div className="flex flex-col gap-3">
      {shown.length > 0 && (
        <ul
          aria-label={label}
          className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
        >
          {shown.map((item) => (
            <li key={item.id} className="flex items-center">
              <label className="accent-brand-700 dark:accent-brand-400 flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-4 py-2 pl-4 text-lg">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) =>
                    run({ type: "toggle", id: item.id, done: event.target.checked }, () =>
                      toggle(item.id, event.target.checked),
                    )
                  }
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
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Verwijderen: ${item.title}`}
                title="Verwijderen"
                className="mx-1 flex size-12 shrink-0 items-center justify-center rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-700 dark:text-stone-500 dark:hover:bg-red-950 dark:hover:text-red-300"
              >
                <TrashIcon className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <FormMessage status="error" message={error} />}
    </div>
  );
}
