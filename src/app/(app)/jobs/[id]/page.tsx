import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { JobStatusBadge } from "@/components/job-list";
import { PageHeader, cardClass, pageClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { getRateOptions } from "@/lib/rates/queries";
import { formatPeriod } from "@/lib/dates";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { setJobStatus } from "../actions";
import { JobForm } from "../job-form";
import { JobHours } from "./job-hours";

export const metadata: Metadata = { title: "Job · Schrijnwerk" };

function formatAddress(line: string | null, postalCode: string | null, city: string | null) {
  return [line, [postalCode, city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

export default async function JobPage({ params }: PageProps<"/jobs/[id]">) {
  const member = await requireMember();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*, customers(id, name, address_line, postal_code, city, archived_at)")
    .eq("id", id.data)
    .maybeSingle();
  if (error) {
    throw new Error(`Could not load job: ${error.message}`);
  }
  if (!job) {
    notFound();
  }

  const { data: activeCustomers, error: customersError } = await supabase
    .from("customers")
    .select("id, name")
    .is("archived_at", null)
    .order("name");
  if (customersError) {
    throw new Error(`Could not load customers: ${customersError.message}`);
  }
  const [entriesResult, membersResult, rates] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, user_id, started_at, ended_at, hourly_rate_cents, note")
      .eq("job_id", job.id)
      .order("started_at", { ascending: false }),
    supabase.from("app_users").select("user_id, display_name"),
    getRateOptions(supabase, job.hourly_rate_id),
  ]);
  if (entriesResult.error || membersResult.error) {
    throw new Error(
      `Could not load hours: ${(entriesResult.error ?? membersResult.error)?.message}`,
    );
  }
  const names = new Map(membersResult.data.map((m) => [m.user_id, m.display_name]));
  const entries = entriesResult.data.map((entry) => ({
    id: entry.id,
    userId: entry.user_id,
    userName: names.get(entry.user_id) ?? "Oud-lid",
    startedAt: entry.started_at,
    endedAt: entry.ended_at,
    hourlyRateCents: entry.hourly_rate_cents,
    note: entry.note,
  }));
  const runningHere = entries.some(
    (entry) => entry.endedAt === null && entry.userId === member.userId,
  );

  // An archived customer stays selectable for their own jobs.
  const customer = job.customers;
  const customers =
    customer && !activeCustomers.some((c) => c.id === customer.id)
      ? [...activeCustomers, { id: customer.id, name: `${customer.name} (gearchiveerd)` }]
      : activeCustomers;

  const ownAddress = formatAddress(job.address_line, job.postal_code, job.city);
  const address =
    ownAddress ||
    (customer ? formatAddress(customer.address_line, customer.postal_code, customer.city) : "");
  const period = formatPeriod(job.starts_on, job.ends_on);
  const otherStatuses = (Object.keys(JOB_STATUS_LABELS) as JobStatus[]).filter(
    (status) => status !== job.status,
  );

  return (
    <main className={pageClass}>
      <PageHeader
        title={job.title}
        back={{ href: "/jobs", label: "Jobs" }}
        description={
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <JobStatusBadge status={job.status} />
              {customer && (
                <Link href={`/klanten/${customer.id}`} className="underline">
                  {customer.name}
                </Link>
              )}
            </span>
            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {address}
              </a>
            )}
            {period && <span>{period}</span>}
          </span>
        }
      />

      {job.description && (
        <p className="text-lg whitespace-pre-line md:max-w-3xl">{job.description}</p>
      )}

      <JobHours
        jobId={job.id}
        jobIsOpen={job.status === "planned" || job.status === "active"}
        entries={entries}
        currentUserId={member.userId}
        runningHere={runningHere}
        showNames={new Set(entries.map((entry) => entry.userId)).size > 1}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <section className="flex flex-col gap-4 lg:order-2">
          <h2 className="text-xl font-semibold">Status wijzigen</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {otherStatuses.map((status) => (
              <ActionButton
                key={status}
                action={setJobStatus}
                values={{ id: job.id, status }}
                label={JOB_STATUS_LABELS[status]}
                pendingLabel="Bezig…"
                className={secondaryButtonClass}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4 lg:order-1">
          <h2 className="text-xl font-semibold">Gegevens bewerken</h2>
          <div className={cardClass}>
            {/* Re-mount when the status changes via the buttons, so the form never saves a stale status. */}
            <JobForm
              key={job.status}
              customers={customers}
              rates={rates}
              job={{
                id: job.id,
                customerId: job.customer_id,
                title: job.title,
                description: job.description ?? "",
                addressLine: job.address_line ?? "",
                postalCode: job.postal_code ?? "",
                city: job.city ?? "",
                status: job.status,
                startsOn: job.starts_on ?? "",
                endsOn: job.ends_on ?? "",
                hourlyRateId: job.hourly_rate_id ?? "",
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
