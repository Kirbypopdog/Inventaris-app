import type { Metadata } from "next";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { EmptyState, PageHeader, cardClass, pageClass } from "@/components/page";
import { Disclosure } from "@/components/disclosure";
import { requireManager } from "@/lib/auth/session";
import { cents, formatEuro } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { makeDefaultHourlyRate, setHourlyRateArchived } from "./actions";
import { RateForm } from "./rate-form";

export const metadata: Metadata = { title: "Uurtarieven · Schrijnwerk" };

export default async function HourlyRatesPage() {
  await requireManager();
  const supabase = await createClient();
  const { data: rates, error } = await supabase
    .from("hourly_rates")
    .select("id, name, rate_cents, is_default, archived_at")
    .order("is_default", { ascending: false })
    .order("archived_at", { nullsFirst: true })
    .order("name");
  if (error) {
    throw new Error(`Could not load hourly rates: ${error.message}`);
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title="Uurtarieven"
        back={{ href: "/account", label: "Meer" }}
        description="Bij het inklokken geldt het tarief van de job, anders het standaardtarief. Uren die al geregistreerd zijn, houden hun tarief."
      />
      <div className="flex flex-col gap-6">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Tarieven</h2>
          {rates.length > 0 ? (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {rates.map((rate) => (
                <li key={rate.id} className={cardClass}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-lg font-semibold">{rate.name}</span>
                    <span className="text-lg tabular-nums">
                      {formatEuro(cents(rate.rate_cents))}/u
                    </span>
                  </div>
                  {rate.is_default && (
                    <p className="bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100 self-start rounded-full px-2.5 py-0.5 text-sm font-medium">
                      Standaardtarief
                    </p>
                  )}
                  {rate.archived_at && <p className="text-base text-stone-500">Gearchiveerd</p>}
                  {!rate.is_default && !rate.archived_at && (
                    <ActionButton
                      action={makeDefaultHourlyRate}
                      values={{ id: rate.id }}
                      label="Maak standaard"
                      pendingLabel="Bezig…"
                      className={secondaryButtonClass}
                    />
                  )}
                  {!rate.is_default && (
                    <ActionButton
                      action={setHourlyRateArchived}
                      values={{ id: rate.id, archive: rate.archived_at ? "false" : "true" }}
                      label={rate.archived_at ? "Terug actief maken" : "Archiveren"}
                      pendingLabel="Bezig…"
                      className={secondaryButtonClass}
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>
              Nog geen uurtarieven. Het eerste tarief wordt automatisch het standaardtarief.
            </EmptyState>
          )}
        </section>
        {/* Open straight away when there is nothing yet, so the first rate is one step away. */}
        <div className="md:max-w-xl">
          <Disclosure summary="Nieuw uurtarief" open={rates.length === 0}>
            <RateForm />
          </Disclosure>
        </div>
      </div>
    </main>
  );
}
