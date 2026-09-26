import Link from "next/link";
import { JobList } from "@/components/job-list";
import {
  EmptyState,
  PageHeader,
  linkButtonClass,
  pageClass,
  secondaryLinkButtonClass,
} from "@/components/page";
import { requireSession } from "@/lib/auth/session";
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
  const { data, error } = await jobsQuery(supabase).in("status", [...OPEN_JOB_STATUSES]);
  if (error) {
    throw new Error(`Could not load open jobs: ${error.message}`);
  }
  const jobs = data.map(toJobListItem);

  return (
    <main className={pageClass}>
      <PageHeader
        title={`Dag ${session.member.displayName}`}
        description="De inklokknop komt hier binnenkort."
      />
      <div className="grid gap-3 md:grid-cols-2">
        <Link href="/jobs/nieuw" className={linkButtonClass}>
          Nieuwe job
        </Link>
        <Link href="/klanten/nieuw" className={secondaryLinkButtonClass}>
          Nieuwe klant
        </Link>
      </div>
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Lopende jobs</h2>
        {jobs.length > 0 ? (
          <JobList jobs={jobs} />
        ) : (
          <EmptyState>Geen geplande of lopende jobs.</EmptyState>
        )}
      </section>
    </main>
  );
}
