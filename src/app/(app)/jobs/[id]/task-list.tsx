"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setTaskDone } from "../notes-actions";
import { FormMessage } from "@/components/form";

export type TaskItem = { id: string; title: string; done: boolean };

/**
 * Tasks with a big checkbox each. Ticking shows at once; the server catches up in the
 * background and the page then moves the task to the right list.
 */
export function TaskChecklist({ tasks, label }: { tasks: TaskItem[]; label: string }) {
  const [shown, setShown] = useOptimistic(tasks, (current, change: { id: string; done: boolean }) =>
    current.map((task) => (task.id === change.id ? { ...task, done: change.done } : task)),
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(id: string, done: boolean) {
    startTransition(async () => {
      setShown({ id, done });
      const result = await setTaskDone(id, done);
      setError(result.status === "error" ? result.message : null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul
        aria-label={label}
        className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900"
      >
        {shown.map((task) => (
          <li key={task.id}>
            <label className="accent-brand-700 dark:accent-brand-400 flex min-h-14 cursor-pointer items-center gap-4 px-4 py-2 text-lg">
              <input
                type="checkbox"
                checked={task.done}
                onChange={(event) => toggle(task.id, event.target.checked)}
                className="size-6 shrink-0"
              />
              <span
                className={`min-w-0 break-words ${
                  task.done ? "text-stone-500 line-through dark:text-stone-500" : ""
                }`}
              >
                {task.title}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {error && <FormMessage status="error" message={error} />}
    </div>
  );
}
