import Link from "next/link";
import { formatPeriod } from "@/lib/dates";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/labels";

export type JobListItem = {
  id: string;
  title: string;
  status: JobStatus;
  startsOn: string | null;
  endsOn: string | null;
  customerName: string | null;
  city: string | null;
};

const STATUS_CLASSES: Record<JobStatus, string> = {
  planned: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
  active: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  done: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  cancelled: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_CLASSES[status]}`}>
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

export function JobList({ jobs }: { jobs: JobListItem[] }) {
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {jobs.map((job) => {
        const period = formatPeriod(job.startsOn, job.endsOn);
        const details = [job.customerName, job.city, period].filter(Boolean).join(" · ");
        return (
          <li key={job.id}>
            <Link
              href={`/jobs/${job.id}`}
              className="flex min-h-16 flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-600"
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-lg font-semibold break-words">{job.title}</span>
                <JobStatusBadge status={job.status} />
              </span>
              {details && (
                <span className="text-base text-stone-600 dark:text-stone-400">{details}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
