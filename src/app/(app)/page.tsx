import Link from "next/link";
import { ElapsedTime } from "@/components/clock";
import { WeekBars } from "@/components/agenda-grid";
import { ClockPanel } from "@/components/clock-panel";
import { JobList } from "@/components/job-list";
import { SearchForm } from "@/components/search-form";
import {
  EmptyState,
  PageHeader,
  linkButtonClass,
  pageClass,
  secondaryLinkButtonClass,
} from "@/components/page";
import { addDays, weekStart } from "@/lib/agenda";
import { isManagerRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getOtherRunningEntries, getRunningEntry } from "@/lib/hours/queries";
import { jobsQuery, plannedJobsQuery, toJobListItem } from "@/lib/jobs/queries";
import { OPEN_JOB_STATUSES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { toBrusselsDate, toBrusselsTime } from "@/lib/time";

export default async function StartPage() {
  const session = await requireSession();

  if (session.status !== "member") {
    return (
      <main className={pageClass}>
        <PageHeader
          title="Nog geen toegang"
          description={
            <>
              Je bent aangemeld als <strong>{session.email}</strong>, maar dit account heeft nog
              geen toegang. Vraag de beheerder om je toe te voegen.
            </>
          }
        />
      </main>
    );
  }

  const supabase = await createClient();
  const today = toBrusselsDate(new Date().toISOString());
  const sunday = addDays(weekStart(today), 6);
  const [openJobs, running, othersRunning, defaultRate, thisWeek] = await Promise.all([
    jobsQuery(supabase).in("status", [...OPEN_JOB_STATUSES]),
    getRunningEntry(supabase, session.member.userId),
    getOtherRunningEntries(supabase, session.member.userId),
    supabase
      .from("hourly_rates")
      .select("id", { count: "exact", head: true })
      .eq("is_default", true)
      .is("archived_at", null),
    plannedJobsQuery(supabase, today, sunday),
  ]);
  if (openJobs.error || defaultRate.error || thisWeek.error) {
    const loadError = openJobs.error ?? defaultRate.error ?? thisWeek.error;
    throw new Error(`Could not load start page: ${loadError?.message}`);
  }
  const weekJobs = thisWeek.data.map(toJobListItem);
  const jobs = openJobs.data.map(toJobListItem);

  return (
    <main className={pageClass}>
      <PageHeader title={`Dag ${session.member.displayName}`} />
      <SearchForm
        label="Zoek in vorige jobs, klanten, offertes…"
        defaultValue=""
        action="/zoeken"
      />
      <ClockPanel
        running={running}
        jobs={jobs.map((job) => ({ id: job.id, title: job.title, customerName: job.customerName }))}
        hasDefaultRate={(defaultRate.count ?? 0) > 0}
        canManageRates={isManagerRole(session.member.role)}
      />
      {othersRunning.length > 0 && (
        <section aria-label="Klokken van anderen" className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Klok loopt ook bij</h2>
          <ul className="flex flex-col gap-2">
            {othersRunning.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/jobs/${entry.jobId}`}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 text-base dark:border-amber-800 dark:bg-amber-950"
                >
                  <span>
                    <strong>{entry.userName}</strong> · {entry.jobTitle} · sinds{" "}
                    {toBrusselsTime(entry.startedAt)}
                  </span>
                  <span className="tabular-nums">
                    <ElapsedTime startedAt={entry.startedAt} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="flex flex-col gap-4" aria-label="Deze week">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-semibold">Deze week</h2>
          <Link href="/agenda" className="py-2 text-base underline">
            Agenda
          </Link>
        </div>
        <WeekBars monday={weekStart(today)} jobs={weekJobs} today={today} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Lopende jobs</h2>
        {jobs.length > 0 ? (
          <JobList jobs={jobs} />
        ) : (
          <EmptyState>Geen geplande of lopende jobs.</EmptyState>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/jobs/nieuw" className={linkButtonClass}>
            Nieuwe job
          </Link>
          <Link href="/klanten/nieuw" className={secondaryLinkButtonClass}>
            Nieuwe klant
          </Link>
        </div>
      </section>
    </main>
  );
}
