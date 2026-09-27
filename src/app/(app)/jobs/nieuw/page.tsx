import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { EmptyState, PageHeader, cardClass, linkButtonClass, pageClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { getRateOptions } from "@/lib/rates/queries";
import { createClient } from "@/lib/supabase/server";
import { JobForm } from "../job-form";

export const metadata: Metadata = { title: "Nieuwe job · Schrijnwerk" };

export default async function NewJobPage({ searchParams }: PageProps<"/jobs/nieuw">) {
  await requireMember();
  const requestedCustomer = z.uuid().safeParse((await searchParams).klant);

  const supabase = await createClient();
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name")
    .is("archived_at", null)
    .order("name");
  if (error) {
    throw new Error(`Could not load customers: ${error.message}`);
  }

  const rates = await getRateOptions(supabase);
  const preselected =
    requestedCustomer.success && customers.some((c) => c.id === requestedCustomer.data)
      ? requestedCustomer.data
      : "";

  return (
    <main className={pageClass}>
      <PageHeader title="Nieuwe job" back={{ href: "/klanten", label: "Projecten" }} />
      {customers.length === 0 ? (
        <div className="flex flex-col gap-4 md:max-w-md">
          <EmptyState>Een job hoort bij een klant. Voeg eerst een klant toe.</EmptyState>
          <Link href="/klanten/nieuw" className={linkButtonClass}>
            Nieuwe klant
          </Link>
        </div>
      ) : (
        <div className={`${cardClass} md:max-w-2xl`}>
          <JobForm
            customers={customers}
            rates={rates}
            job={{
              customerId: preselected,
              title: "",
              description: "",
              addressLine: "",
              postalCode: "",
              city: "",
              status: "planned",
              startsOn: "",
              endsOn: "",
              hourlyRateId: "",
              travelMethod: "",
              kmRate: "",
              tripFlat: "",
              materialMargin: "",
              vatRate: "",
            }}
          />
        </div>
      )}
    </main>
  );
}
