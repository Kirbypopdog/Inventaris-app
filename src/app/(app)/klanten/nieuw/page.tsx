import type { Metadata } from "next";
import { PageHeader, cardClass, pageClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { CustomerForm, emptyCustomer } from "../customer-form";

export const metadata: Metadata = { title: "Nieuwe klant · Schrijnwerk" };

export default async function NewCustomerPage() {
  await requireMember();
  return (
    <main className={pageClass}>
      <PageHeader title="Nieuwe klant" back={{ href: "/klanten", label: "Projecten" }} />
      <div className={`${cardClass} md:max-w-2xl`}>
        <CustomerForm customer={emptyCustomer} />
      </div>
    </main>
  );
}
