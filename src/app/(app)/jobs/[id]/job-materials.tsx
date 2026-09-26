import Link from "next/link";
import { deleteUsage } from "@/app/(app)/materiaal/usage-actions";
import { ActionButton } from "@/components/action-button";
import { dangerButtonClass } from "@/components/form";
import { EmptyState, cardClass } from "@/components/page";
import { formatDate } from "@/lib/dates";
import { sumUsages, usageCost } from "@/lib/materials/totals";
import { formatEuro } from "@/lib/money";
import { formatQuantity, formatQuantityInput } from "@/lib/quantity";
import {
  CatalogUsageForm,
  OtherUsageForm,
  UsageUpdateForm,
  type MaterialOption,
} from "./material-usage-forms";

export type JobMaterialUsage = {
  id: string;
  description: string;
  unit: string;
  packagePriceCents: number;
  unitsPerPackage: number;
  quantity: number;
  usedOn: string;
};

/** Material used on a job: total cost, add from the catalogue, correct or delete. */
export function JobMaterials({
  jobId,
  usages,
  materials,
  today,
}: {
  jobId: string;
  usages: JobMaterialUsage[];
  materials: MaterialOption[];
  today: string;
}) {
  return (
    <section id="materiaal" className="flex scroll-mt-4 flex-col gap-4">
      <h2 className="text-xl font-semibold">Materiaal</h2>

      <div className={cardClass}>
        {materials.length > 0 ? (
          <CatalogUsageForm jobId={jobId} materials={materials} today={today} />
        ) : (
          <p className="text-lg">
            De catalogus is nog leeg.{" "}
            <Link href="/materiaal/nieuw" className="underline">
              Voeg eerst materiaal toe
            </Link>
            , of gebruik &quot;Iets anders toevoegen&quot;.
          </p>
        )}
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-base underline">
            Iets anders toevoegen (niet uit de catalogus)
          </summary>
          <div className="mt-3">
            <OtherUsageForm jobId={jobId} today={today} />
          </div>
        </details>
      </div>

      <p className="text-lg">
        Totaal materiaal (kostprijs): <strong>{formatEuro(sumUsages(usages))}</strong>
      </p>

      {usages.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {usages.map((usage) => (
            <li key={usage.id} className={cardClass}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-lg font-semibold break-words">{usage.description}</span>
                <span className="text-lg tabular-nums">{formatEuro(usageCost(usage))}</span>
              </div>
              <p className="text-base text-zinc-600 dark:text-zinc-400">
                {formatQuantity(usage.quantity)} {usage.unit} · {formatDate(usage.usedOn)}
              </p>
              <details>
                <summary className="flex min-h-12 cursor-pointer items-center text-base underline">
                  Aanpassen of verwijderen
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <UsageUpdateForm
                    id={usage.id}
                    quantity={formatQuantityInput(usage.quantity)}
                    unit={usage.unit}
                    usedOn={usage.usedOn}
                  />
                  <ActionButton
                    action={deleteUsage}
                    values={{ id: usage.id }}
                    label="Verwijderen"
                    pendingLabel="Bezig…"
                    className={dangerButtonClass}
                    confirm={`${usage.description} verwijderen van deze job?`}
                  />
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState>Nog geen materiaal op deze job.</EmptyState>
      )}
    </section>
  );
}
