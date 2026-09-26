import type { Metadata } from "next";
import { PageHeader, cardClass, pageClass } from "@/components/page";
import { requireManager } from "@/lib/auth/session";
import { cents, formatEuroInput } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { TravelSettingsForm } from "./travel-settings-form";

export const metadata: Metadata = { title: "Verplaatsingen · Schrijnwerk" };

export default async function TravelSettingsPage() {
  await requireManager();
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("travel_method, km_rate_cents, trip_flat_cents")
    .single();
  if (error) {
    throw new Error(`Could not load settings: ${error.message}`);
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title="Verplaatsingen"
        back={{ href: "/account", label: "Account" }}
        description="Geldt voor alle jobs. Ritten die al toegevoegd zijn, houden hun tarief."
      />
      <div className={`${cardClass} md:max-w-2xl`}>
        <TravelSettingsForm
          settings={{
            method: settings.travel_method,
            kmRate: formatEuroInput(cents(settings.km_rate_cents)),
            tripFlat: formatEuroInput(cents(settings.trip_flat_cents)),
          }}
        />
      </div>
    </main>
  );
}
