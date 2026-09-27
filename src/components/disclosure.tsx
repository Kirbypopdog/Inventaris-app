import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/icons";

const BOX_CLASSES = {
  /** A block of its own, like a form to add something. */
  card: "rounded-2xl border border-stone-200 bg-white px-4 dark:border-stone-800 dark:bg-stone-950",
  /** A block inside a form, like the exceptions on rates. */
  nested: "rounded-xl border border-stone-200 px-4 dark:border-stone-800",
  /** A fold-out inside a card, like "Aanpassen of verwijderen". */
  inline: "border-t border-stone-100 dark:border-stone-800",
} as const;

/**
 * A section that folds open on a tap, with the same look everywhere: the summary as a big tap
 * target and a chevron that turns when open.
 */
export function Disclosure({
  summary,
  variant = "card",
  open,
  children,
}: {
  summary: string;
  variant?: keyof typeof BOX_CLASSES;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className={`group ${BOX_CLASSES[variant]}`}>
      <summary
        className={`flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden ${
          variant === "inline"
            ? "min-h-12 text-base font-medium text-stone-700 dark:text-stone-300"
            : "min-h-14 text-lg font-medium"
        }`}
      >
        {summary}
        <ChevronRightIcon className="size-5 shrink-0 text-stone-400 transition-transform group-open:rotate-90" />
      </summary>
      <div className={`flex flex-col gap-4 ${variant === "inline" ? "pt-1 pb-2" : "pt-1 pb-4"}`}>
        {children}
      </div>
    </details>
  );
}
