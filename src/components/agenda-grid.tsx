import Link from "next/link";
import { JobStatusBadge, type JobListItem } from "@/components/job-list";
import {
  type BarSpan,
  addDays,
  barSpan,
  dayOfMonth,
  formatDay,
  formatWeekdayShort,
  isWeekend,
  layoutBars,
  monthOf,
  weekDays,
} from "@/lib/agenda";
import { formatPeriod } from "@/lib/dates";
import type { JobStatus } from "@/lib/labels";

/** Same colours as the status badges, a shade stronger so a bar stands out on a busy grid. */
const BAR_CLASSES: Record<JobStatus, string> = {
  planned: "bg-sky-200 text-sky-950 dark:bg-sky-800 dark:text-sky-50",
  active: "bg-amber-300 text-amber-950 dark:bg-amber-700 dark:text-amber-50",
  done: "bg-green-200 text-green-950 dark:bg-green-800 dark:text-green-50",
  cancelled: "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

/** Bars that run on past the edge of a row lose their rounded corner on that side. */
function barShape(span: BarSpan): string {
  return `${span.continuesBefore ? "rounded-l-none" : "rounded-l-lg"} ${
    span.continuesAfter ? "rounded-r-none" : "rounded-r-lg"
  }`;
}

function gridColumn(span: BarSpan): string {
  return `${span.start + 1} / ${span.end + 2}`;
}

function jobSummary(job: JobListItem): string {
  return [job.title, job.customerName, job.city, formatPeriod(job.startsOn, job.endsOn)]
    .filter(Boolean)
    .join(" · ");
}

function DayHeader({ day, today }: { day: string; today: string }) {
  const isToday = day === today;
  return (
    <div
      className={`flex flex-col items-center gap-0.5 py-1 text-xs ${
        isWeekend(day) ? "text-stone-400" : "text-stone-600 dark:text-stone-400"
      }`}
    >
      <span>{formatWeekdayShort(day)}</span>
      <span
        aria-current={isToday ? "date" : undefined}
        className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${
          isToday ? "bg-brand-700 dark:bg-brand-400 dark:text-brand-950 text-white" : ""
        }`}
      >
        {dayOfMonth(day)}
      </span>
    </div>
  );
}

/**
 * A week with one row per job: its title on top and a bar across the days it is planned.
 * Readable on a phone, where seven columns are too narrow for text.
 */
export function WeekBars({
  monday,
  jobs,
  today,
}: {
  monday: string;
  jobs: JobListItem[];
  today: string;
}) {
  const days = weekDays(monday);
  const rows = jobs
    .map((job) => ({ job, span: barSpan(job, days) }))
    .filter((row): row is { job: JobListItem; span: BarSpan } => row.span !== null)
    .sort((a, b) => a.span.start - b.span.start || b.span.end - a.span.end);

  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden="true" className="grid grid-cols-7 px-3">
        {days.map((day) => (
          <DayHeader key={day} day={day} today={today} />
        ))}
      </div>
      {rows.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {rows.map(({ job, span }) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                aria-label={jobSummary(job)}
                className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-3 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-600"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold break-words">{job.title}</span>
                    <span className="text-sm text-stone-600 dark:text-stone-400">
                      {[job.customerName, job.city].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <JobStatusBadge status={job.status} />
                </span>
                <span className="relative grid grid-cols-7">
                  {days.map((day, index) => (
                    <span
                      key={day}
                      style={{ gridColumn: index + 1, gridRow: 1 }}
                      className={`h-3 ${
                        day === today
                          ? "bg-brand-100 dark:bg-brand-950"
                          : isWeekend(day)
                            ? "bg-stone-100 dark:bg-stone-900"
                            : ""
                      }`}
                    />
                  ))}
                  <span
                    data-bar
                    style={{ gridColumn: gridColumn(span), gridRow: 1 }}
                    className={`h-3 ${barShape(span)} ${BAR_CLASSES[job.status]}`}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-lg text-stone-600 dark:border-stone-700 dark:text-stone-400">
          Niets gepland deze week.
        </p>
      )}
    </div>
  );
}

/** A month as a calendar: a row per week, jobs as bars across their days, stacked in lanes. */
export function MonthGrid({
  month,
  mondays,
  jobs,
  today,
}: {
  month: string;
  mondays: string[];
  jobs: JobListItem[];
  today: string;
}) {
  const firstWeek = mondays[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950">
      {firstWeek && (
        <div
          aria-hidden="true"
          className="grid grid-cols-7 border-b border-stone-200 py-1 text-center text-xs text-stone-500 dark:border-stone-800"
        >
          {weekDays(firstWeek).map((day) => (
            <span key={day}>{formatWeekdayShort(day)}</span>
          ))}
        </div>
      )}
      <ol>
        {mondays.map((monday) => {
          const days = weekDays(monday);
          const bars = layoutBars(jobs, days);
          return (
            <li
              key={monday}
              aria-label={`Week van ${formatDay(monday)} tot ${formatDay(addDays(monday, 6))}`}
              className="relative grid min-h-20 grid-cols-7 content-start gap-y-1 border-b border-stone-200 pb-2 last:border-b-0 md:min-h-28 dark:border-stone-800"
            >
              <span aria-hidden="true" className="absolute inset-0 grid grid-cols-7">
                {days.map((day) => (
                  <span
                    key={day}
                    className={`border-l border-stone-100 first:border-l-0 dark:border-stone-900 ${
                      isWeekend(day) ? "bg-stone-50 dark:bg-stone-900/40" : ""
                    }`}
                  />
                ))}
              </span>
              {days.map((day, index) => (
                <span
                  key={`number-${day}`}
                  aria-hidden="true"
                  style={{ gridColumn: index + 1, gridRow: 1 }}
                  className="relative flex justify-center pt-1"
                >
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-sm ${
                      day === today
                        ? "bg-brand-700 dark:bg-brand-400 dark:text-brand-950 font-semibold text-white"
                        : monthOf(day) === month
                          ? "text-stone-700 dark:text-stone-300"
                          : "text-stone-300 dark:text-stone-600"
                    }`}
                  >
                    {dayOfMonth(day)}
                  </span>
                </span>
              ))}
              {bars.map(({ item: job, span, lane }) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  aria-label={jobSummary(job)}
                  style={{ gridColumn: gridColumn(span), gridRow: lane + 2 }}
                  className={`relative mx-0.5 truncate px-1.5 py-0.5 text-xs font-medium md:text-sm ${barShape(
                    span,
                  )} ${BAR_CLASSES[job.status]}`}
                >
                  {job.title}
                </Link>
              ))}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
