import Link from "next/link";

export type FilterChip = { label: string; href: string; active: boolean };

/** One scrollable row of filter links; the active one gets the accent colour. */
export function FilterChips({ label, chips }: { label: string; chips: FilterChip[] }) {
  return (
    <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex w-max gap-2">
        {chips.map((chip) => (
          <li key={chip.label}>
            <Link
              href={chip.href}
              aria-current={chip.active ? "true" : undefined}
              className={`flex min-h-12 items-center rounded-full border px-4 text-base whitespace-nowrap ${
                chip.active
                  ? "border-brand-700 bg-brand-700 dark:border-brand-400 dark:bg-brand-400 dark:text-brand-950 text-white"
                  : "border-stone-300 bg-white hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900"
              }`}
            >
              {chip.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
