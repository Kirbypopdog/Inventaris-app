import type { Metadata } from "next";
import Link from "next/link";
import { AgendaWeek } from "@/components/agenda-week";
import { JobList } from "@/components/job-list";
import { PageHeader, pageClass, secondaryLinkButtonClass } from "@/components/page";
import { addDays, formatDay, isDateValue, isoWeekNumber, weekDays, weekStart } from "@/lib/agenda";
import { requireMember } from "@/lib/auth/session";
import { plannedJobsQuery, toJobListItem, unplannedJobsQuery } from "@/lib/jobs/queries";
import { createClient } from "@/lib/supabase/server";
import { toBrusselsDate } from "@/lib/time";

export const metadata: Metadata = { title: "Agenda · Schrijnwerk" };

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  await requireMember();
  const today = toBrusselsDate(new Date().toISOString());
  const requested = (await searchParams).week;
  const monday = weekStart(
    typeof requested === "string" && isDateValue(requested) ? requested : today,
  );
  const days = weekDays(monday);
  const sunday = addDays(monday, 6);

  const supabase = await createClient();
  const [planned, unplanned] = await Promise.all([
    plannedJobsQuery(supabase, monday, sunday),
    unplannedJobsQuery(supabase),
  ]);
  if (planned.error || unplanned.error) {
    throw new Error(`Could not load agenda: ${(planned.error ?? unplanned.error)?.message}`);
  }
  const unplannedJobs = unplanned.data.map(toJobListItem);

  return (
    <main className={pageClass}>
      <PageHeader
        title={`Week ${isoWeekNumber(monday)}`}
        description={`${formatDay(monday)} – ${formatDay(sunday)}`}
      />
      <nav aria-label="Andere week" className="grid grid-cols-3 gap-3 md:max-w-lg">
        <Link href={`/agenda?week=${addDays(monday, -7)}`} className={secondaryLinkButtonClass}>
          ← Vorige
        </Link>
        <Link href="/agenda" className={secondaryLinkButtonClass}>
          Deze week
        </Link>
        <Link href={`/agenda?week=${addDays(monday, 7)}`} className={secondaryLinkButtonClass}>
          Volgende →
        </Link>
      </nav>

      <AgendaWeek days={days} jobs={planned.data.map(toJobListItem)} today={today} />

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
