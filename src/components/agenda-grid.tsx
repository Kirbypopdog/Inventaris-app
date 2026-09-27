import Link from "next/link";
import type { JobListItem } from "@/components/job-list";
import {
  type BarSpan,
  addDays,
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

function jobSummary(job: JobListItem): string {
  return [job.title, job.customerName, job.city, formatPeriod(job.startsOn, job.endsOn)]
    .filter(Boolean)
    .join(" · ");
}

/**
 * One week of the calendar: seven day columns, with each job as a bar across only the days
 * it is planned, stacked in lanes so bars never overlap.
 * - `month` dims the days of other months (month view).
 * - `large` gives taller rows with the customer under the title (week view).
 */
function WeekRow({
  monday,
  jobs,
  today,
  month,
  large = false,
}: {
  monday: string;
  jobs: JobListItem[];
  today: string;
  month?: string;
  large?: boolean;
}) {
  const days = weekDays(monday);
  const bars = layoutBars(jobs, days);

  return (
    <li
      aria-label={`Week van ${formatDay(monday)} tot ${formatDay(addDays(monday, 6))}`}
      className={`relative grid grid-cols-7 content-start gap-y-1 border-b border-stone-200 pb-2 last:border-b-0 dark:border-stone-800 ${
        large ? "min-h-48 md:min-h-64" : "min-h-20 md:min-h-28"
      }`}
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
      {days.map((day, index) => {
        const isToday = day === today;
        const inMonth = month === undefined || monthOf(day) === month;
        return (
          <span
            key={day}
            aria-hidden="true"
            style={{ gridColumn: index + 1, gridRow: 1 }}
            className="relative flex flex-col items-center pt-1"
          >
            {large && (
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {formatWeekdayShort(day)}
              </span>
            )}
            <span
              className={`flex size-7 items-center justify-center rounded-full text-sm ${
                isToday
                  ? "bg-brand-700 dark:bg-brand-400 dark:text-brand-950 font-semibold text-white"
                  : inMonth
                    ? "text-stone-700 dark:text-stone-300"
                    : "text-stone-300 dark:text-stone-600"
              }`}
            >
              {dayOfMonth(day)}
            </span>
          </span>
        );
      })}
      {bars.map(({ item: job, span, lane }) => (
        <Link
          key={job.id}
          href={`/jobs/${job.id}`}
          aria-label={jobSummary(job)}
          style={{ gridColumn: `${span.start + 1} / ${span.end + 2}`, gridRow: lane + 2 }}
          className={`relative mx-0.5 flex min-w-0 flex-col px-1.5 py-0.5 text-xs font-medium md:text-sm ${
            large ? "min-h-10 justify-center py-1" : ""
          } ${barShape(span)} ${BAR_CLASSES[job.status]}`}
        >
          <span className="truncate">{job.title}</span>
          {large && job.customerName && (
            <span className="truncate font-normal opacity-80">{job.customerName}</span>
          )}
        </Link>
      ))}
    </li>
  );
}

function WeekdayHeader({ monday }: { monday: string }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-7 border-b border-stone-200 py-1 text-center text-xs text-stone-500 dark:border-stone-800"
    >
      {weekDays(monday).map((day) => (
        <span key={day}>{formatWeekdayShort(day)}</span>
      ))}
    </div>
  );
}

const calendarClass =
  "overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950";

/** A week as a calendar row with room for the title and customer on each bar. */
export function WeekCalendar({
  monday,
  jobs,
  today,
}: {
  monday: string;
  jobs: JobListItem[];
  today: string;
}) {
  const planned = layoutBars(jobs, weekDays(monday)).length > 0;
  return (
    <div className="flex flex-col gap-2">
      <div className={calendarClass}>
        <ol>
          <WeekRow monday={monday} jobs={jobs} today={today} large />
        </ol>
      </div>
      {!planned && (
        <p className="text-center text-base text-stone-600 dark:text-stone-400">
          Niets gepland deze week.
        </p>
      )}
    </div>
  );
}

/** A month as a calendar: a row per week, jobs as bars across their days. */
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
    <div className={calendarClass}>
      {firstWeek && <WeekdayHeader monday={firstWeek} />}
      <ol>
        {mondays.map((monday) => (
          <WeekRow key={monday} monday={monday} jobs={jobs} today={today} month={month} />
        ))}
      </ol>
    </div>
  );
}
