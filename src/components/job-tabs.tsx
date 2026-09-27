import Link from "next/link";
import { JOB_TABS, type JobTab, jobTabHref } from "@/lib/jobs/tabs";

/** The row of tabs on a job page: one scrollable line, the active tab underlined. */
export function JobTabs({ jobId, active }: { jobId: string; active: JobTab }) {
  return (
    <nav
      aria-label="Onderdelen van de job"
      className="bg-background sticky top-0 z-[5] -mx-4 [scrollbar-width:none] overflow-x-auto overflow-y-hidden border-b border-stone-200 px-4 sm:mx-0 sm:px-0 dark:border-stone-800"
    >
      <ul className="flex w-max gap-1">
        {JOB_TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key}>
              <Link
                href={jobTabHref(jobId, tab.key)}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px flex min-h-12 items-center border-b-2 px-3 text-base whitespace-nowrap ${
                  isActive
                    ? "border-brand-600 text-brand-800 dark:border-brand-400 dark:text-brand-200 font-semibold"
                    : "border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
