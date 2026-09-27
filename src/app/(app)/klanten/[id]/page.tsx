import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { JobList } from "@/components/job-list";
import { EmptyState, PageHeader, cardClass, linkButtonClass, pageClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { formatBelgianVatNumber } from "@/lib/belgium";
import { jobsQuery, toJobListItem } from "@/lib/jobs/queries";
import { CUSTOMER_TYPE_LABELS } from "@/lib/labels";
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
  const address = [
    customer.address_line,
    [customer.postal_code, customer.city].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className={pageClass}>
      <PageHeader
        title={customer.name}
        back={{ href: "/klanten", label: "Klanten" }}
        description={
          <span className="flex flex-col gap-1">
            <span>
              {CUSTOMER_TYPE_LABELS[customer.type]}
              {customer.archived_at && " · gearchiveerd"}
            </span>
            {address && <span>{address}</span>}
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="underline">
                {customer.phone}
              </a>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="break-all underline">
                {customer.email}
              </a>
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

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Jobs</h2>
          {jobs.length > 0 ? (
            <JobList jobs={jobs} />
          ) : (
            <EmptyState>Nog geen jobs voor deze klant.</EmptyState>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Gegevens bewerken</h2>
          <div className={cardClass}>
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
          </div>
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
        </section>
      </div>
    </main>
  );
}
