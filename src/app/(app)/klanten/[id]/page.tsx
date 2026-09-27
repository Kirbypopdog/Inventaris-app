import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { JobList } from "@/components/job-list";
import {
  EmptyState,
  PageHeader,
  linkButtonClass,
  pageClass,
  secondaryLinkButtonClass,
} from "@/components/page";
import { formatAddress, mapsUrl } from "@/lib/address";
import { requireMember } from "@/lib/auth/session";
import { formatBelgianVatNumber } from "@/lib/belgium";
import { jobsQuery, toJobListItem } from "@/lib/jobs/queries";
import { CUSTOMER_TYPE_LABELS, OPEN_JOB_STATUSES } from "@/lib/labels";
import { travelOverrideFormValues } from "@/lib/rates/overrides";
import { createClient } from "@/lib/supabase/server";
import { setCustomerArchived } from "../actions";
import { CustomerForm } from "../customer-form";

export const metadata: Metadata = { title: "Klant · Schrijnwerk" };

export default async function CustomerPage({ params }: PageProps<"/klanten/[id]">) {
  await requireMember();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: customer, error }, { data: jobRows, error: jobsError }] = await Promise.all([
    supabase.from("customers").select("*").eq("id", id.data).maybeSingle(),
    jobsQuery(supabase).eq("customer_id", id.data),
  ]);
  if (error || jobsError) {
    throw new Error(`Could not load customer: ${(error ?? jobsError)?.message}`);
  }
  if (!customer) {
    notFound();
  }
  const jobs = jobRows.map(toJobListItem);
  const address = formatAddress(customer.address_line, customer.postal_code, customer.city);

  const openJobs = jobs.filter((job) => OPEN_JOB_STATUSES.includes(job.status));
  const closedJobs = jobs.filter((job) => !OPEN_JOB_STATUSES.includes(job.status));
  const contact = [
    customer.phone && { href: `tel:${customer.phone}`, label: "Bellen" },
    customer.email && { href: `mailto:${customer.email}`, label: "Mailen" },
    address && { href: mapsUrl(address), label: "Route", external: true },
  ].filter((item) => !!item);

  return (
    <main className={pageClass}>
      <PageHeader
        title={customer.name}
        back={{ href: "/klanten", label: "Projecten" }}
        description={
          <span className="flex flex-col gap-2">
            <span className="flex flex-wrap gap-1.5 text-sm">
              <span className="bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100 rounded-full px-2.5 py-0.5">
                {CUSTOMER_TYPE_LABELS[customer.type]}
              </span>
              {customer.archived_at && (
                <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                  Gearchiveerd
                </span>
              )}
            </span>
            {address && <span>{address}</span>}
            {(customer.phone || customer.email) && (
              <span className="break-all">
                {[customer.phone, customer.email].filter(Boolean).join(" · ")}
              </span>
            )}
            {customer.vat_number && <span>{formatBelgianVatNumber(customer.vat_number)}</span>}
          </span>
        }
        action={
          <Link href={`/jobs/nieuw?klant=${customer.id}`} className={linkButtonClass}>
            Nieuwe job
          </Link>
        }
      />

      {contact.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:max-w-lg">
          {contact.map((item) => (
            <a
              key={item.label}
              href={item.href}
              {...("external" in item ? { target: "_blank", rel: "noreferrer" } : {})}
              className={secondaryLinkButtonClass}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Lopende jobs</h2>
        {openJobs.length > 0 ? (
          <JobList jobs={openJobs} />
        ) : (
          <EmptyState>Geen lopende jobs voor deze klant.</EmptyState>
        )}
      </section>

      {closedJobs.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Afgesloten jobs</h2>
          <JobList jobs={closedJobs} />
        </section>
      )}

      <details className="group rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
        <summary className="flex min-h-12 cursor-pointer items-center justify-between text-lg font-semibold">
          Gegevens bewerken
          <span aria-hidden="true" className="text-stone-400 group-open:rotate-90">
            ›
          </span>
        </summary>
        <div className="mt-4 flex flex-col gap-4 md:max-w-2xl">
          <CustomerForm
            customer={{
              id: customer.id,
              type: customer.type,
              name: customer.name,
              vatNumber: customer.vat_number ?? "",
              email: customer.email ?? "",
              phone: customer.phone ?? "",
              addressLine: customer.address_line ?? "",
              postalCode: customer.postal_code ?? "",
              city: customer.city ?? "",
              notes: customer.notes ?? "",
              ...travelOverrideFormValues(customer),
            }}
          />
          <ActionButton
            action={setCustomerArchived}
            values={{ id: customer.id, archive: customer.archived_at ? "false" : "true" }}
            label={customer.archived_at ? "Terugzetten in de lijst" : "Archiveren"}
            pendingLabel="Bezig…"
            className={secondaryButtonClass}
            confirm={
              customer.archived_at
                ? undefined
                : `${customer.name} archiveren? De klant verdwijnt uit de lijst, maar alle jobs blijven bewaard.`
            }
          />
        </div>
      </details>
    </main>
  );
}
