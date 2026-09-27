import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "@/components/icons";

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
        <Link href={back.href} className={`${quietLinkClass} -ml-1 self-start`}>
          <ChevronLeftIcon className="size-5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold break-words">{title}</h1>
          {description && (
            <div className="text-lg text-stone-600 dark:text-stone-400">{description}</div>
          )}
        </div>
        {action && <div className="md:w-64">{action}</div>}
      </div>
    </div>
  );
}

export const cardClass =
  "flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900";

export const linkButtonClass =
  "flex min-h-14 w-full items-center justify-center rounded-xl bg-brand-700 px-4 text-lg " +
  "font-semibold text-white hover:bg-brand-800 dark:bg-brand-400 dark:text-brand-950 " +
  "dark:hover:bg-brand-300";

export const secondaryLinkButtonClass =
  "flex min-h-14 w-full items-center justify-center rounded-xl border border-stone-300 bg-white " +
  "px-4 text-lg font-medium hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-lg text-stone-600 dark:border-stone-700 dark:text-stone-400">
      {children}
    </p>
  );
}

/** A link inside running text: the accent colour, underlined only on hover. */
export const textLinkClass =
  "font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-300";

/** A secondary link on its own line (back, archive): grey, a big tap target. */
export const quietLinkClass =
  "inline-flex min-h-11 items-center gap-1 text-base font-medium text-stone-600 " +
  "hover:text-brand-700 dark:text-stone-400 dark:hover:text-brand-300";

/** A title that opens something: stays dark, takes the accent colour on hover. */
export const titleLinkClass = "hover:text-brand-700 dark:hover:text-brand-300";
