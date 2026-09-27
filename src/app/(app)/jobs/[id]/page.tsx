import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { JobStatusBadge } from "@/components/job-list";
import { EmptyState, PageHeader, cardClass, pageClass, textLinkClass } from "@/components/page";
import { MapPinIcon } from "@/components/icons";
import { JobTabs } from "@/components/job-tabs";
import { QuoteList } from "@/components/quote-list";
import { jobCalculation } from "@/lib/analyses";
import { jobBudget } from "@/lib/budget";
import { loadAnalysisData } from "@/lib/analyses-queries";
import { isManagerRole } from "@/lib/auth/roles";
import { formatAddress, mapsUrl } from "@/lib/address";
import { requireMember } from "@/lib/auth/session";
import { marginFormValue, travelOverrideFormValues } from "@/lib/rates/overrides";
import { getRateOptions } from "@/lib/rates/queries";
import { formatPeriod } from "@/lib/dates";
import { describePrice } from "@/lib/materials/format";
import { QUOTE_STATUS_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getJobTrips } from "@/lib/trips/queries";
import { quotesQuery, toQuoteListItem } from "@/lib/quotes/queries";
import { createQuote } from "@/app/(app)/offertes/actions";
import { toBrusselsDate } from "@/lib/time";
import { JobForm } from "../job-form";
import { JobClock } from "./job-clock";
import { JobHours } from "./job-hours";
import { JobOverview, type OverviewTile } from "./job-overview";
import { sumEntries } from "@/lib/hours/totals";
import { sumUsages } from "@/lib/materials/totals";
import { sumTrips } from "@/lib/trips/totals";
import { parseJobTab } from "@/lib/jobs/tabs";
import { formatEuro } from "@/lib/money";
import { formatDuration } from "@/lib/time";
import { JobMaterials } from "./job-materials";
import { JobNotes } from "./job-notes";
import { JobTrips } from "./job-trips";

export const metadata: Metadata = { title: "Job · Schrijnwerk" };

export default async function JobPage({ params, searchParams }: PageProps<"/jobs/[id]">) {
  const member = await requireMember();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) {
    notFound();
  }

  const tab = parseJobTab((await searchParams).tab);

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
  const [
    entriesResult,
    membersResult,
    rates,
    usagesResult,
    materialsResult,
    travel,
    quotesResult,
    analysis,
    tasksResult,
    notesResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from("time_entries")
      .select("id, user_id, started_at, ended_at, hourly_rate_cents, note")
      .eq("job_id", job.id)
      .order("started_at", { ascending: false }),
    supabase.from("app_users").select("user_id, display_name"),
    getRateOptions(supabase, job.hourly_rate_id),
    supabase
      .from("material_usages")
      .select("id, description, unit, package_price_cents, units_per_package, quantity, used_on")
      .eq("job_id", job.id)
      .order("used_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("materials")
      .select("id, name, unit, package_price_cents, units_per_package")
      .is("archived_at", null)
      .order("name"),
    getJobTrips(supabase, job.id),
    quotesQuery(supabase).eq("job_id", job.id),
    loadAnalysisData(supabase, job.id),
    supabase
      .from("job_tasks")
      .select("id, title, done_at")
      .eq("job_id", job.id)
      .order("created_at"),
    supabase
      .from("job_notes")
      .select("id, body, created_by, created_at")
      .eq("job_id", job.id)
      .order("created_at", { ascending: false }),
    supabase.from("settings").select("budget_warning_percent").single(),
  ]);
  if (
    entriesResult.error ||
    membersResult.error ||
    usagesResult.error ||
    materialsResult.error ||
    quotesResult.error ||
    tasksResult.error ||
    notesResult.error ||
    settingsResult.error
  ) {
    const loadError =
      entriesResult.error ??
      membersResult.error ??
      usagesResult.error ??
      materialsResult.error ??
      quotesResult.error ??
      tasksResult.error ??
      notesResult.error ??
      settingsResult.error;
    throw new Error(`Could not load job details: ${loadError?.message}`);
  }
  const quotes = quotesResult.data.map(toQuoteListItem);
  const usages = usagesResult.data.map((usage) => ({
    id: usage.id,
    description: usage.description,
    unit: usage.unit,
    packagePriceCents: usage.package_price_cents,
    unitsPerPackage: usage.units_per_package,
    quantity: usage.quantity,
    usedOn: usage.used_on,
  }));
  const materials = materialsResult.data.map((material) => ({
    id: material.id,
    name: material.name,
    unit: material.unit,
    unitsPerPackage: material.units_per_package,
    priceLabel: describePrice({
      packagePriceCents: material.package_price_cents,
      unitsPerPackage: material.units_per_package,
      unit: material.unit,
    }),
  }));
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
  const tasks = tasksResult.data.map((task) => ({
    id: task.id,
    title: task.title,
    done: task.done_at !== null,
  }));
  const notes = notesResult.data.map((note) => ({
    id: note.id,
    body: note.body,
    authorName: names.get(note.created_by) ?? "Oud-lid",
    createdAt: note.created_at,
  }));
  const today = toBrusselsDate(new Date().toISOString());
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
  const jobIsOpen = job.status === "planned" || job.status === "active";

  const calculation = jobCalculation(analysis);
  const hours = sumEntries(entries);
  const tripCount = travel.trips.length;
  const latestQuote = quotes[0];
  const tiles: OverviewTile[] = [
    {
      tab: "uren",
      label: "Uren",
      value: formatDuration(hours.minutes),
      detail: formatEuro(hours.amount),
    },
    {
      tab: "materiaal",
      label: "Materiaal",
      value: formatEuro(sumUsages(usages)),
      detail: usages.length === 1 ? "1 regel" : `${usages.length} regels`,
    },
    travel.terms.method === "included"
      ? { tab: "ritten", label: "Ritten", value: "Inbegrepen", detail: "Geen ritten nodig" }
      : {
          tab: "ritten",
          label: "Ritten",
          value: formatEuro(sumTrips(travel.trips)),
          detail: tripCount === 1 ? "1 rit" : `${tripCount} ritten`,
        },
    {
      tab: "offertes",
      label: "Offertes",
      value: String(quotes.length),
      detail: latestQuote
        ? `${latestQuote.number} · ${QUOTE_STATUS_LABELS[latestQuote.status]}`
        : "Nog geen offerte",
    },
  ];

  return (
    <main className={pageClass}>
      <PageHeader
        title={job.title}
        back={
          customer
            ? { href: `/klanten/${customer.id}`, label: customer.name }
            : { href: "/klanten", label: "Projecten" }
        }
        description={
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap items-center gap-2">
              <JobStatusBadge status={job.status} />
              {customer && (
                <Link href={`/klanten/${customer.id}`} className={textLinkClass}>
                  {customer.name}
                </Link>
              )}
              {period && <span>· {period}</span>}
            </span>
            {address && (
              <a
                href={mapsUrl(address)}
                target="_blank"
                rel="noreferrer"
                className={`${textLinkClass} inline-flex items-center gap-1 self-start`}
              >
                <MapPinIcon className="size-5 shrink-0" />
                {address}
              </a>
            )}
          </span>
        }
        action={<JobClock jobId={job.id} jobIsOpen={jobIsOpen} runningHere={runningHere} />}
      />

      <JobTabs jobId={job.id} active={tab} />

      {tab === "overzicht" && (
        <JobOverview
          jobId={job.id}
          status={job.status}
          description={job.description}
          tiles={tiles}
          openTasks={tasks.filter((task) => !task.done)}
          calculation={calculation}
          budget={jobBudget(calculation, settingsResult.data.budget_warning_percent)}
        />
      )}

      {tab === "notities" && <JobNotes jobId={job.id} tasks={tasks} notes={notes} />}

      {tab === "uren" && (
        <JobHours
          jobId={job.id}
          entries={entries}
          currentUserId={member.userId}
          showNames={new Set(entries.map((entry) => entry.userId)).size > 1}
        />
      )}

      {tab === "materiaal" && (
        <JobMaterials jobId={job.id} usages={usages} materials={materials} today={today} />
      )}

      {tab === "ritten" && (
        <JobTrips
          jobId={job.id}
          terms={travel.terms}
          trips={travel.trips}
          today={today}
          canManageSettings={isManagerRole(member.role)}
        />
      )}

      {tab === "offertes" && (
        <section className="flex flex-col gap-4">
          <h2 className="sr-only">Offertes</h2>
          {quotes.length > 0 ? (
            <QuoteList quotes={quotes} showJob={false} />
          ) : (
            <EmptyState>Nog geen offertes voor deze job.</EmptyState>
          )}
          <div className="md:max-w-xs">
            <ActionButton
              action={createQuote}
              values={{ jobId: job.id }}
              label="Nieuwe offerte"
              pendingLabel="Bezig…"
              className={secondaryButtonClass}
            />
          </div>
        </section>
      )}

      {tab === "gegevens" && (
        <section className="flex flex-col gap-4 md:max-w-3xl">
          <h2 className="sr-only">Gegevens bewerken</h2>
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
                ...travelOverrideFormValues(job),
                materialMargin: marginFormValue(job.material_margin_bp),
                vatRate: job.vat_rate === null ? "" : String(job.vat_rate),
              }}
            />
          </div>
        </section>
      )}
    </main>
  );
}
