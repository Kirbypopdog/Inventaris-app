import Link from "next/link";
import { JobStatusBadge, type JobListItem } from "@/components/job-list";
import { coversDay, formatDay } from "@/lib/agenda";

/** The days of a week with the jobs planned on each day. */
export function AgendaWeek({
  days,
  jobs,
  today,
  hideEmptyDays = false,
}: {
  days: string[];
  jobs: JobListItem[];
  today: string;
  hideEmptyDays?: boolean;
}) {
  const perDay = days
    .map((day) => ({ day, jobs: jobs.filter((job) => coversDay(job, day)) }))
    .filter((entry) => !hideEmptyDays || entry.jobs.length > 0);

  return (
    <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {perDay.map(({ day, jobs: dayJobs }) => (
        <li
          key={day}
          aria-label={formatDay(day)}
          className={`flex flex-col gap-2 rounded-2xl border p-4 ${
            day === today
              ? "border-zinc-900 dark:border-zinc-50"
              : "border-zinc-200 dark:border-zinc-800"
          }`}
        >
          <h3 className="text-base font-semibold first-letter:uppercase">
            {formatDay(day)}
            {day === today && <span className="font-normal text-zinc-500"> · vandaag</span>}
          </h3>
          {dayJobs.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {dayJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="flex min-h-12 flex-col gap-1 rounded-xl bg-zinc-100 px-3 py-2 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium break-words">{job.title}</span>
                      <JobStatusBadge status={job.status} />
                    </span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      {[job.customerName, job.city].filter(Boolean).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500">Niets gepland.</p>
          )}
        </li>
      ))}
    </ol>
  );
}
