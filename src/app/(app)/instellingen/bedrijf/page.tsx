import type { Metadata } from "next";
import { PageHeader, cardClass, pageClass } from "@/components/page";
import { requireManager } from "@/lib/auth/session";
import { formatBelgianVatNumber } from "@/lib/belgium";
import { formatIban } from "@/lib/iban";
import { createClient } from "@/lib/supabase/server";
import { CompanyForm } from "./company-form";

export const metadata: Metadata = { title: "Bedrijfsgegevens · Schrijnwerk" };

export default async function CompanyPage() {
  await requireManager();
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select(
      "company_name, vat_number, address_line, postal_code, city, email, phone, iban, quote_validity_days, vat_rate",
    )
    .single();
  if (error) {
    throw new Error(`Could not load settings: ${error.message}`);
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title="Bedrijfsgegevens"
        back={{ href: "/account", label: "Meer" }}
        description="Deze gegevens komen op offertes en facturen."
      />
      <div className={`${cardClass} md:max-w-2xl`}>
        <CompanyForm
          company={{
            companyName: settings.company_name,
            vatNumber: settings.vat_number ? formatBelgianVatNumber(settings.vat_number) : "",
            addressLine: settings.address_line ?? "",
            postalCode: settings.postal_code ?? "",
            city: settings.city ?? "",
            email: settings.email ?? "",
            phone: settings.phone ?? "",
            iban: settings.iban ? formatIban(settings.iban) : "",
            quoteValidityDays: String(settings.quote_validity_days),
            vatRate: String(settings.vat_rate),
          }}
        />
      </div>
    </main>
  );
}
