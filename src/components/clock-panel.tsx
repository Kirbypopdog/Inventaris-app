import Link from "next/link";
import { clockIn, clockOut } from "@/app/(app)/uren/actions";
import { ActionButton } from "@/components/action-button";
import { ElapsedTime } from "@/components/clock";
import { EmptyState, cardClass, secondaryLinkButtonClass } from "@/components/page";
import type { RunningEntry } from "@/lib/hours/queries";
import { toBrusselsTime } from "@/lib/time";

const bigButtonClass =
  "min-h-20 w-full rounded-2xl px-4 text-xl font-semibold disabled:opacity-60 " +
  "bg-green-700 text-white dark:bg-green-600";
const stopButtonClass =
  "min-h-20 w-full rounded-2xl px-4 text-xl font-semibold disabled:opacity-60 " +
  "bg-red-700 text-white dark:bg-red-600";
const jobButtonClass =
  "min-h-16 w-full rounded-2xl border-2 border-zinc-300 px-4 text-left text-lg font-semibold " +
  "disabled:opacity-60 dark:border-zinc-700";

export type ClockJob = { id: string; title: string; customerName: string | null };

/**
 * The clock on the start page. Not clocked in: one tap on a job clocks in.
 * Clocked in: the running job with a live timer, and a big button to clock out.
 */
export function ClockPanel({
  running,
  jobs,
  hasDefaultRate,
  canManageRates,
}: {
  running: RunningEntry | null;
  jobs: ClockJob[];
  hasDefaultRate: boolean;
  canManageRates: boolean;
}) {
  if (running) {
    const otherJobs = jobs.filter((job) => job.id !== running.jobId);
    return (
      <section aria-label="Klok" className={`${cardClass} border-green-600 dark:border-green-700`}>
        <div className="flex flex-col gap-1">
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            Ingeklokt sinds {toBrusselsTime(running.startedAt)}
          </p>
          <Link href={`/jobs/${running.jobId}`} className="text-2xl font-semibold underline">
            {running.jobTitle}
          </Link>
          <p className="text-4xl font-bold tabular-nums">
            <ElapsedTime startedAt={running.startedAt} />
          </p>
        </div>
        <ActionButton
          action={clockOut}
          values={{}}
          label="Uitklokken"
          pendingLabel="Bezig met uitklokken…"
          className={stopButtonClass}
        />
        <Link href={`/jobs/${running.jobId}#materiaal`} className={secondaryLinkButtonClass}>
          Materiaal toevoegen
        </Link>
        {otherJobs.length > 0 && (
          <details className="group">
            <summary className="flex min-h-14 cursor-pointer items-center text-lg font-medium underline">
              Wissel van job
            </summary>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {otherJobs.map((job) => (
                <li key={job.id}>
                  <ActionButton
                    action={clockIn}
                    values={{ jobId: job.id }}
                    label={job.customerName ? `${job.title} · ${job.customerName}` : job.title}
                    pendingLabel="Bezig met wisselen…"
                    className={jobButtonClass}
                  />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    );
  }

  if (!hasDefaultRate) {
    return (
      <section aria-label="Klok" className={cardClass}>
        <p className="text-lg">
          Om in te klokken is er een standaard-uurtarief nodig.
          {canManageRates ? "" : " Vraag de beheerder om er een in te stellen."}
        </p>
        {canManageRates && (
          <Link
            href="/instellingen/uurtarieven"
            className="flex min-h-14 items-center justify-center rounded-xl bg-zinc-900 px-4 text-lg font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Uurtarief instellen
          </Link>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Klok" className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold">Inklokken op</h2>
      {jobs.length > 0 ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <ActionButton
                action={clockIn}
                values={{ jobId: job.id }}
                label={job.customerName ? `${job.title} · ${job.customerName}` : job.title}
                pendingLabel="Bezig met inklokken…"
                className={bigButtonClass}
              />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Maak eerst een job aan om op in te klokken.</EmptyState>
      )}
    </section>
  );
}
