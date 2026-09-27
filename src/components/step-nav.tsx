import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const stepClass =
  "flex min-h-12 min-w-11 items-center justify-center rounded-xl border border-stone-300 bg-white " +
  "px-3 text-base font-medium hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900";

type Step = { href: string; label: string };

/** ‹ Today › : step through weeks, months or years in one compact row. */
export function StepNav({
  label,
  previous,
  current,
  next,
}: {
  label: string;
  previous: Step;
  current: Step;
  next: Step;
}) {
  return (
    <nav aria-label={label} className="flex gap-1.5">
      <Link href={previous.href} aria-label={previous.label} className={stepClass}>
        <ChevronLeftIcon className="size-5" />
      </Link>
      <Link href={current.href} className={stepClass}>
        {current.label}
      </Link>
      <Link href={next.href} aria-label={next.label} className={stepClass}>
        <ChevronRightIcon className="size-5" />
      </Link>
    </nav>
  );
}
