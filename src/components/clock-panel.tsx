import Link from "next/link";
import { clockIn, clockOut } from "@/app/(app)/uren/actions";
import { ActionButton } from "@/components/action-button";
import { ElapsedTime } from "@/components/clock";
import { clockInButtonClass, clockOutButtonClass } from "@/components/form";
import { JobStatusBadge, type JobListItem } from "@/components/job-list";
import {
  EmptyState,
  cardClass,
  linkButtonClass,
  secondaryLinkButtonClass,
} from "@/components/page";
import { formatPeriod } from "@/lib/dates";
import { jobTabHref } from "@/lib/jobs/tabs";
import type { RunningEntry } from "@/lib/hours/queries";
import { toBrusselsTime } from "@/lib/time";

/**
 * The clock and the open jobs on the start page, in one list: every job has its own button to
 * clock in (or to switch to it while the clock runs). The running job sits on top with a live
 * timer and a big button to clock out.
 */
export function ClockPanel({
  running,
  jobs,
  hasDefaultRate,
  canManageRates,
}: {
  running: RunningEntry | null;
  jobs: JobListItem[];
  hasDefaultRate: boolean;
  canManageRates: boolean;
}) {
  const otherJobs = running ? jobs.filter((job) => job.id !== running.jobId) : jobs;

  return (
    <section aria-label="Klok" className="flex flex-col gap-4">
      {running && (
        <div className={`${cardClass} border-l-brand-600 dark:border-l-brand-400 border-l-4`}>
          <div className="flex flex-col gap-1">
            <p className="text-base text-stone-600 dark:text-stone-400">
              Ingeklokt sinds {toBrusselsTime(running.startedAt)}
            </p>
            <Link href={`/jobs/${running.jobId}`} className="text-2xl font-semibold underline">
              {running.jobTitle}
            </Link>
            <p className="text-4xl font-bold tabular-nums">
              <ElapsedTime startedAt={running.startedAt} />
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <ActionButton
              action={clockOut}
              values={{}}
              label="Uitklokken"
              pendingLabel="Bezig met uitklokken…"
              className={clockOutButtonClass}
            />
            <Link
              href={jobTabHref(running.jobId, "materiaal")}
              className={secondaryLinkButtonClass}
            >
              Materiaal toevoegen
            </Link>
          </div>
        </div>
      )}

      {!hasDefaultRate && (
        <div className={cardClass}>
          <p className="text-lg">
            Om in te klokken is er een standaard-uurtarief nodig.
            {canManageRates ? "" : " Vraag de beheerder om er een in te stellen."}
          </p>
          {canManageRates && (
            <Link href="/instellingen/uurtarieven" className={linkButtonClass}>
              Uurtarief instellen
            </Link>
          )}
        </div>
      )}

      <h2 className="text-xl font-semibold">{running ? "Wissel van job" : "Mijn jobs"}</h2>
      {otherJobs.length > 0 ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {otherJobs.map((job) => {
            const details = [job.customerName, job.city, formatPeriod(job.startsOn, job.endsOn)]
              .filter(Boolean)
              .join(" · ");
            return (
              <li
                key={job.id}
                className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950"
              >
                <Link href={`/jobs/${job.id}`} className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="text-lg font-semibold break-words">{job.title}</span>
                    {details && (
                      <span className="text-base text-stone-600 dark:text-stone-400">
                        {details}
                      </span>
                    )}
                  </span>
                  <JobStatusBadge status={job.status} />
                </Link>
                {hasDefaultRate && (
                  <ActionButton
                    action={clockIn}
                    values={{ jobId: job.id }}
                    label={running ? "Wissel naar deze job" : "Inklokken"}
                    pendingLabel={running ? "Bezig met wisselen…" : "Bezig met inklokken…"}
                    className={clockInButtonClass}
                  />
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>
          {running ? "Geen andere open jobs." : "Geen geplande of lopende jobs."}
        </EmptyState>
      )}
    </section>
  );
}
