import Link from "next/link";
import type { ReactNode } from "react";

/** Content width: narrow on a phone, wider on a laptop. */
export const pageClass =
  "mx-auto flex w-full max-w-md flex-col gap-6 p-4 sm:p-6 md:max-w-3xl lg:max-w-5xl";

export function PageHeader({
  title,
  back,
  description,
  action,
}: {
  title: string;
  back?: { href: string; label: string };
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {back && (
        <Link
          href={back.href}
          className="self-start py-2 text-base text-zinc-600 underline dark:text-zinc-400"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold break-words">{title}</h1>
          {description && (
            <div className="text-lg text-zinc-600 dark:text-zinc-400">{description}</div>
          )}
        </div>
        {action && <div className="md:w-64">{action}</div>}
      </div>
    </div>
  );
}

export const cardClass =
  "flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950";

export const linkButtonClass =
  "flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-lg " +
  "font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900";

export const secondaryLinkButtonClass =
  "flex min-h-14 w-full items-center justify-center rounded-xl border border-zinc-300 px-4 " +
  "text-lg font-medium dark:border-zinc-700";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-lg text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
      {children}
    </p>
  );
}
