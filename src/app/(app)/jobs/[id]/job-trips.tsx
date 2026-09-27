import Link from "next/link";
import { deleteTrip } from "@/app/(app)/ritten/actions";
import { ActionButton } from "@/components/action-button";
import { dangerButtonClass } from "@/components/form";
import { EmptyState, cardClass } from "@/components/page";
import { formatDate } from "@/lib/dates";
import { cents, formatEuro } from "@/lib/money";
import { formatQuantity, formatQuantityInput } from "@/lib/quantity";
import type { JobTrip, TravelTerms } from "@/lib/trips/queries";
import { sumTrips, tripCost } from "@/lib/trips/totals";
import { TripForm } from "./trip-forms";

function describeTerms(terms: TravelTerms): string {
  switch (terms.method) {
    case "per_km":
      return `Per km: ${formatEuro(cents(terms.rateCents))} per km.`;
    case "flat":
      return `Vast bedrag per rit: ${formatEuro(cents(terms.rateCents))}.`;
    case "included":
      return "Verplaatsingen zijn inbegrepen voor deze job. Je hoeft geen ritten toe te voegen.";
  }
}

/** Trips to a job: how they are charged, add a trip, correct or delete, total. */
export function JobTrips({
  jobId,
  terms,
  trips,
  today,
  canManageSettings,
}: {
  jobId: string;
  terms: TravelTerms;
  trips: JobTrip[];
  today: string;
  canManageSettings: boolean;
}) {
  const lastDistance = trips.find((trip) => trip.distanceKm !== null)?.distanceKm ?? null;
  const unpriced = terms.method !== "included" && terms.rateCents === 0;

  return (
    <section id="ritten" className="flex scroll-mt-4 flex-col gap-4">
      <h2 className="text-xl font-semibold">Verplaatsingen</h2>
      <p className="text-lg">
        {describeTerms(terms)}
        {unpriced && canManageSettings && (
          <>
            {" "}
            <Link href="/instellingen/verplaatsingen" className="underline">
              Bedrag instellen
            </Link>
          </>
        )}
      </p>

      {terms.method !== "included" && (
        <div className={cardClass}>
          <TripForm
            perKm={terms.method === "per_km"}
            trip={{
              jobId,
              tripDate: today,
              // Usually the same trip as last time.
              distance: lastDistance === null ? "" : formatQuantityInput(lastDistance),
              note: "",
            }}
          />
        </div>
      )}

      {trips.length > 0 && (
        <p className="text-lg">
          Totaal verplaatsingen: <strong>{formatEuro(sumTrips(trips))}</strong>
        </p>
      )}

      {trips.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {trips.map((trip) => (
            <li key={trip.id} className={cardClass}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-semibold">
                  {formatDate(trip.tripDate)}
                  {trip.distanceKm !== null && ` · ${formatQuantity(trip.distanceKm)} km`}
                </span>
                <span className="text-lg tabular-nums">{formatEuro(tripCost(trip))}</span>
              </div>
              <p className="text-base text-stone-600 dark:text-stone-400">
                {[
                  trip.method === "per_km"
                    ? `${formatEuro(cents(trip.rateCents))}/km`
                    : "vast bedrag",
                  trip.note,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <details>
                <summary className="flex min-h-12 cursor-pointer items-center text-base underline">
                  Aanpassen of verwijderen
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <TripForm
                    perKm={trip.method === "per_km"}
                    trip={{
                      id: trip.id,
                      jobId,
                      tripDate: trip.tripDate,
                      distance:
                        trip.distanceKm === null ? "" : formatQuantityInput(trip.distanceKm),
                      note: trip.note ?? "",
                    }}
                  />
                  <ActionButton
                    action={deleteTrip}
                    values={{ id: trip.id }}
                    label="Verwijderen"
                    pendingLabel="Bezig…"
                    className={dangerButtonClass}
                    confirm="Deze rit verwijderen?"
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        terms.method !== "included" && <EmptyState>Nog geen ritten naar deze job.</EmptyState>
      )}
    </section>
  );
}
