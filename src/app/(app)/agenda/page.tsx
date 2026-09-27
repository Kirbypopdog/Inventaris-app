import type { Metadata } from "next";
import Link from "next/link";
import { MonthGrid, WeekCalendar } from "@/components/agenda-grid";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { JobList } from "@/components/job-list";
import { PageHeader, pageClass } from "@/components/page";
import {
  addDays,
  addMonths,
  formatMonth,
  isDateValue,
  isMonthValue,
  isoWeekNumber,
  monthOf,
  monthWeeks,
  weekStart,
} from "@/lib/agenda";
import { requireMember } from "@/lib/auth/session";
import { formatPeriod } from "@/lib/dates";
import { plannedJobsQuery, toJobListItem, unplannedJobsQuery } from "@/lib/jobs/queries";
import { createClient } from "@/lib/supabase/server";
import { toBrusselsDate } from "@/lib/time";

export const metadata: Metadata = { title: "Agenda · Schrijnwerk" };

const stepClass =
  "flex min-h-12 min-w-11 items-center justify-center rounded-xl border border-stone-300 bg-white " +
  "px-3 text-base font-medium hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900";

function viewClass(active: boolean): string {
  return `flex min-h-11 items-center rounded-lg px-3 text-base font-medium ${
    active
      ? "bg-brand-700 text-white dark:bg-brand-400 dark:text-brand-950"
      : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
  }`;
}

/** Week (`?week=<monday>`) or month (`?maand=2026-09`); without a parameter, this week. */
type View =
  | { kind: "week"; monday: string; from: string; until: string }
  | { kind: "month"; month: string; mondays: string[]; from: string; until: string };

function resolveView(
  params: { week?: string | string[]; maand?: string | string[] },
  today: string,
): View {
  if (typeof params.maand === "string" && isMonthValue(params.maand)) {
    const mondays = monthWeeks(params.maand);
    const first = mondays[0] ?? weekStart(`${params.maand}-01`);
    const last = mondays[mondays.length - 1] ?? first;
    return { kind: "month", month: params.maand, mondays, from: first, until: addDays(last, 6) };
  }
  const monday = weekStart(
    typeof params.week === "string" && isDateValue(params.week) ? params.week : today,
  );
  return { kind: "week", monday, from: monday, until: addDays(monday, 6) };
}

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await requireMember();
  const today = toBrusselsDate(new Date().toISOString());
  const view = resolveView(await searchParams, today);

  const supabase = await createClient();
  const [planned, unplanned] = await Promise.all([
    plannedJobsQuery(supabase, view.from, view.until),
    unplannedJobsQuery(supabase),
  ]);
  if (planned.error || unplanned.error) {
    throw new Error(`Could not load agenda: ${(planned.error ?? unplanned.error)?.message}`);
  }
  const plannedJobs = planned.data.map(toJobListItem);
  const unplannedJobs = unplanned.data.map(toJobListItem);

  const isWeek = view.kind === "week";
  // Switching view keeps the period in sight: the week's month, or this week when the month
  // contains today and otherwise the month's first week.
  const weekHref = `/agenda?week=${
    isWeek ? view.monday : weekStart(view.month === monthOf(today) ? today : `${view.month}-01`)
  }`;
  const monthHref = `/agenda?maand=${isWeek ? monthOf(addDays(view.monday, 3)) : view.month}`;
  const step = isWeek
    ? {
        previous: `/agenda?week=${addDays(view.monday, -7)}`,
        next: `/agenda?week=${addDays(view.monday, 7)}`,
        today: "/agenda",
        unit: "week",
      }
    : {
        previous: `/agenda?maand=${addMonths(view.month, -1)}`,
        next: `/agenda?maand=${addMonths(view.month, 1)}`,
        today: `/agenda?maand=${monthOf(today)}`,
        unit: "maand",
      };

  return (
    <main className={pageClass}>
      <PageHeader
        title={
          isWeek
            ? `Week ${isoWeekNumber(view.monday)}`
            : formatMonth(view.month).replace(/^./, (letter) => letter.toUpperCase())
        }
        description={isWeek ? formatPeriod(view.monday, view.until) : undefined}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav
          aria-label="Weergave"
          className="flex rounded-xl border border-stone-300 bg-white p-0.5 dark:border-stone-700 dark:bg-stone-900"
        >
          <Link
            href={weekHref}
            aria-current={isWeek ? "true" : undefined}
            className={viewClass(isWeek)}
          >
            Week
          </Link>
          <Link
            href={monthHref}
            aria-current={isWeek ? undefined : "true"}
            className={viewClass(!isWeek)}
          >
            Maand
          </Link>
        </nav>
        <nav aria-label={`Andere ${step.unit}`} className="flex gap-1.5">
          <Link href={step.previous} aria-label={`Vorige ${step.unit}`} className={stepClass}>
            <ChevronLeftIcon className="size-5" />
          </Link>
          <Link href={step.today} className={stepClass}>
            Vandaag
          </Link>
          <Link href={step.next} aria-label={`Volgende ${step.unit}`} className={stepClass}>
            <ChevronRightIcon className="size-5" />
          </Link>
        </nav>
      </div>

      {isWeek ? (
        <WeekCalendar monday={view.monday} jobs={plannedJobs} today={today} />
      ) : (
        <MonthGrid month={view.month} mondays={view.mondays} jobs={plannedJobs} today={today} />
      )}

      {unplannedJobs.length > 0 && (
        <section className="flex flex-col gap-4" aria-label="Nog niet ingepland">
          <h2 className="text-xl font-semibold">Nog niet ingepland</h2>
          <p className="text-base text-stone-600 dark:text-stone-400">
            Open jobs zonder startdatum. Geef ze een start (en einde) op de jobpagina.
          </p>
          <JobList jobs={unplannedJobs} />
        </section>
      )}
    </main>
  );
}
