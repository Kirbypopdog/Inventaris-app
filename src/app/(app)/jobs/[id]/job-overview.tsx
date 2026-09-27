import Link from "next/link";
import { setJobStatus } from "../actions";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { JobCalculationSummary } from "@/components/job-calculation";
import { cardClass } from "@/components/page";
import type { JobCalculation } from "@/lib/analyses";
import { type JobTab, jobTabHref } from "@/lib/jobs/tabs";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/labels";

export type OverviewTile = { tab: JobTab; label: string; value: string; detail: string };

/** The first tab of a job: what is going on at a glance, the post-calculation and the status. */
export function JobOverview({
  jobId,
  status,
  description,
  tiles,
  calculation,
}: {
  jobId: string;
  status: JobStatus;
  description: string | null;
  tiles: OverviewTile[];
  calculation: JobCalculation;
}) {
  const otherStatuses = (Object.keys(JOB_STATUS_LABELS) as JobStatus[]).filter(
    (other) => other !== status,
  );

  return (
    <div className="flex flex-col gap-6">
      {description && <p className="text-lg whitespace-pre-line md:max-w-3xl">{description}</p>}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.tab}>
            <Link
              href={jobTabHref(jobId, tile.tab)}
              className="flex h-full min-h-24 flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-600"
            >
              <span className="text-sm font-medium text-stone-500">{tile.label}</span>
              <span className="text-xl font-semibold tabular-nums">{tile.value}</span>
              <span className="text-sm text-stone-600 dark:text-stone-400">{tile.detail}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="flex flex-col gap-4" aria-label="Nacalculatie">
          <h2 className="text-xl font-semibold">Nacalculatie</h2>
          <div className={cardClass}>
            <JobCalculationSummary calculation={calculation} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Status wijzigen</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {otherStatuses.map((other) => (
              <ActionButton
                key={other}
                action={setJobStatus}
                values={{ id: jobId, status: other }}
                label={JOB_STATUS_LABELS[other]}
                pendingLabel="Bezig…"
                className={secondaryButtonClass}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
