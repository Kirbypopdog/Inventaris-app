import Link from "next/link";
import { ClockPanel } from "@/components/clock-panel";
import { JobList } from "@/components/job-list";
import {
  EmptyState,
  PageHeader,
  linkButtonClass,
  pageClass,
  secondaryLinkButtonClass,
} from "@/components/page";
import { isManagerRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";
import { getRunningEntry } from "@/lib/hours/queries";
import { jobsQuery, toJobListItem } from "@/lib/jobs/queries";
import { OPEN_JOB_STATUSES } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

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
  const [openJobs, running, defaultRate] = await Promise.all([
    jobsQuery(supabase).in("status", [...OPEN_JOB_STATUSES]),
    getRunningEntry(supabase, session.member.userId),
    supabase
      .from("hourly_rates")
      .select("id", { count: "exact", head: true })
      .eq("is_default", true)
      .is("archived_at", null),
  ]);
  if (openJobs.error || defaultRate.error) {
    throw new Error(`Could not load start page: ${(openJobs.error ?? defaultRate.error)?.message}`);
  }
  const jobs = openJobs.data.map(toJobListItem);

  return (
    <main className={pageClass}>
      <PageHeader title={`Dag ${session.member.displayName}`} />
      <ClockPanel
        running={running}
        jobs={jobs.map((job) => ({ id: job.id, title: job.title, customerName: job.customerName }))}
        hasDefaultRate={(defaultRate.count ?? 0) > 0}
        canManageRates={isManagerRole(session.member.role)}
      />
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
