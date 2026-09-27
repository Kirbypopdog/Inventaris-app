import Link from "next/link";
import { setJobStatus } from "../actions";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { BudgetBar } from "@/components/budget-bar";
import { JobCalculationSummary } from "@/components/job-calculation";
import { cardClass, quietLinkClass } from "@/components/page";
import type { JobCalculation } from "@/lib/analyses";
import type { Budget } from "@/lib/budget";
import { type JobTab, jobTabHref } from "@/lib/jobs/tabs";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/labels";
import { TaskChecklist, type TaskItem } from "./task-list";

/** The overview shows only the first open tasks; the rest is one tap away. */
const OVERVIEW_TASK_LIMIT = 5;

export type OverviewTile = { tab: JobTab; label: string; value: string; detail: string };

/**
 * The first tab of a job: what is going on at a glance (open tasks, totals), the
 * post-calculation and the status.
 */
export function JobOverview({
  jobId,
  status,
  description,
  tiles,
  openTasks,
  calculation,
  budget,
}: {
  jobId: string;
  status: JobStatus;
  description: string | null;
  tiles: OverviewTile[];
  openTasks: TaskItem[];
  calculation: JobCalculation;
  budget: Budget | null;
}) {
  const otherStatuses = (Object.keys(JOB_STATUS_LABELS) as JobStatus[]).filter(
    (other) => other !== status,
  );

  return (
    <div className="flex flex-col gap-6">
      {description && <p className="text-lg whitespace-pre-line md:max-w-3xl">{description}</p>}

      {budget && <BudgetBar budget={budget} />}

      {openTasks.length > 0 && (
        <section className="flex flex-col gap-3 md:max-w-3xl">
          <h2 className="text-xl font-semibold">Nog te doen</h2>
          <TaskChecklist tasks={openTasks.slice(0, OVERVIEW_TASK_LIMIT)} label="Nog te doen" />
          <Link href={jobTabHref(jobId, "notities")} className={`${quietLinkClass} self-start`}>
            {openTasks.length > OVERVIEW_TASK_LIMIT
              ? `Alle ${openTasks.length} taken en de notities`
              : "Taken en notities"}
          </Link>
        </section>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.tab}>
            <Link
              href={jobTabHref(jobId, tile.tab)}
              className="flex h-full min-h-24 flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-600"
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
            <JobCalculationSummary calculation={calculation} showDifference={budget === null} />
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
