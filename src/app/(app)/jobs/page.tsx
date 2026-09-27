import type { Metadata } from "next";
import Link from "next/link";
import { JobList } from "@/components/job-list";
import { EmptyState, PageHeader, linkButtonClass, pageClass } from "@/components/page";
import { SearchForm } from "@/components/search-form";
import { requireMember } from "@/lib/auth/session";
import { jobStatusSchema } from "@/lib/jobs/schemas";
import { jobsQuery, toJobListItem } from "@/lib/jobs/queries";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/labels";
import { cleanSearchTerm, ilikeAnyFilter } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Jobs · Schrijnwerk" };

function filterHref(status: JobStatus | null, term: string): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (term) params.set("q", term);
  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  await requireMember();
  const params = await searchParams;
  const term = cleanSearchTerm(params.q);
  const parsedStatus = jobStatusSchema.safeParse(params.status);
  const status = parsedStatus.success ? parsedStatus.data : null;

  const supabase = await createClient();
  let query = jobsQuery(supabase);
  if (status) {
    query = query.eq("status", status);
  }
  const filter = ilikeAnyFilter(["title", "description", "city"], term);
  if (filter) {
    query = query.or(filter);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Could not load jobs: ${error.message}`);
  }
  const jobs = data.map(toJobListItem);

  const chips: { status: JobStatus | null; label: string }[] = [
    { status: null, label: "Alle" },
    ...(Object.keys(JOB_STATUS_LABELS) as JobStatus[]).map((value) => ({
      status: value,
      label: JOB_STATUS_LABELS[value],
    })),
  ];

  return (
    <main className={pageClass}>
      <PageHeader
        title="Jobs"
        description={
          <Link href="/agenda" className="underline">
            Naar de agenda
          </Link>
        }
        action={
          <Link href="/jobs/nieuw" className={linkButtonClass}>
            Nieuwe job
          </Link>
        }
      />
      <SearchForm
        label="Zoek op naam, omschrijving of gemeente"
        defaultValue={term}
        hidden={status ? { status } : undefined}
      />
      <nav aria-label="Filter op status" className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = chip.status === status;
          return (
            <Link
              key={chip.label}
              href={filterHref(chip.status, term)}
              aria-current={active ? "true" : undefined}
              className={`flex min-h-12 items-center rounded-full border px-4 text-base ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {chip.label}
            </Link>
          );
        })}
      </nav>
      {jobs.length > 0 ? (
        <JobList jobs={jobs} />
      ) : (
        <EmptyState>{term || status ? "Geen jobs gevonden." : "Nog geen jobs."}</EmptyState>
      )}
    </main>
  );
}
