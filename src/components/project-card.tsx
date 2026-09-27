import Link from "next/link";
import { JobStatusBadge } from "@/components/job-list";
import { mapsUrl } from "@/lib/address";
import { formatPeriod } from "@/lib/dates";
import { CUSTOMER_TYPE_LABELS, type CustomerType } from "@/lib/labels";
import type { ProjectCard as Card, ProjectCustomer } from "@/lib/projects";

export type ProjectCustomerView = ProjectCustomer & {
  type: CustomerType;
  city: string | null;
  phone: string | null;
  address: string;
};

export type ProjectSection = "active" | "planned" | "others";

const DOT_CLASSES: Record<ProjectSection, string> = {
  active: "bg-brand-600 dark:bg-brand-400",
  planned: "bg-sky-500",
  others: "bg-stone-300 dark:bg-stone-600",
};

const actionClass =
  "flex min-h-11 flex-1 items-center justify-center rounded-xl border border-stone-200 px-3 " +
  "text-base font-medium hover:border-stone-400 dark:border-stone-700";

/** One customer with its open jobs, in the style of a concept card. */
export function ProjectCard({
  card,
  section,
}: {
  card: Card<ProjectCustomerView>;
  section: ProjectSection;
}) {
  const { customer, shownJobs, closedCount } = card;
  return (
    <article
      aria-label={customer.name}
      className={`flex h-full flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950 ${
        section === "active" ? "border-l-brand-600 dark:border-l-brand-400 border-l-4" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className={`mt-2 size-2.5 shrink-0 rounded-sm ${DOT_CLASSES[section]}`}
        />
        <Link
          href={`/klanten/${customer.id}`}
          className="text-lg font-semibold break-words hover:underline"
        >
          {customer.name}
        </Link>
      </div>
      <div className="flex flex-wrap gap-1.5 text-sm">
        <span className="bg-brand-50 text-brand-800 dark:bg-brand-950 dark:text-brand-200 rounded-full px-2.5 py-0.5">
          {CUSTOMER_TYPE_LABELS[customer.type]}
        </span>
        {customer.city && (
          <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            {customer.city}
          </span>
        )}
      </div>

      {shownJobs.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {shownJobs.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="flex min-h-12 items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-800"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="font-medium break-words">{job.title}</span>
                  <span className="text-sm text-stone-600 dark:text-stone-400">
                    {formatPeriod(job.startsOn, job.endsOn) ?? "Nog niet ingepland"}
                  </span>
                </span>
                <JobStatusBadge status={job.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-stone-500">
        {shownJobs.length === 0 && closedCount === 0
          ? "Nog geen jobs"
          : shownJobs.length === 0
            ? "Geen lopende jobs"
            : null}
        {shownJobs.length === 0 && closedCount > 0 && " · "}
        {closedCount > 0 && (
          <Link href={`/klanten/${customer.id}`} className="underline">
            {closedCount === 1 ? "1 afgesloten job" : `${closedCount} afgesloten jobs`}
          </Link>
        )}
      </p>

      <div className="mt-auto flex gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
        {customer.phone && (
          <a href={`tel:${customer.phone}`} className={actionClass}>
            Bellen
          </a>
        )}
        {customer.address && (
          <a
            href={mapsUrl(customer.address)}
            target="_blank"
            rel="noreferrer"
            className={actionClass}
          >
            Route
          </a>
        )}
        <Link
          href={`/jobs/nieuw?klant=${customer.id}`}
          aria-label={`Nieuwe job voor ${customer.name}`}
          className={actionClass}
        >
          + Job
        </Link>
      </div>
    </article>
  );
}

/** The dashed card that starts a new customer, like "Nieuw concept". */
export function NewCustomerCard() {
  return (
    <Link
      href="/klanten/nieuw"
      className="hover:border-brand-500 hover:text-brand-700 dark:hover:border-brand-400 dark:hover:text-brand-300 flex h-full min-h-40 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-stone-300 p-4 text-stone-600 dark:border-stone-700 dark:text-stone-400"
    >
      <span aria-hidden="true" className="text-3xl leading-none">
        +
      </span>
      <span className="text-base font-medium">Nieuwe klant</span>
    </Link>
  );
}
