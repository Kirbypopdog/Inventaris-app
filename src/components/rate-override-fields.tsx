import { inputClass } from "@/components/form";
import { TRAVEL_METHOD_LABELS, type TravelMethod } from "@/lib/labels";

export type RateOverrideValues = {
  travelMethod: string;
  kmRate: string;
  tripFlat: string;
  materialMargin?: string;
};

/**
 * Exceptions to the general settings, inside a customer or job form. Collapsed unless an
 * exception is set. Empty fields fall back to the next level (`fallback`).
 */
export function RateOverrideFields({
  values,
  fallback,
  showMargin,
}: {
  values: RateOverrideValues;
  fallback: string;
  showMargin: boolean;
}) {
  const hasException = Object.values(values).some((value) => value !== "" && value !== undefined);

  return (
    <details
      open={hasException}
      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <summary className="flex min-h-12 cursor-pointer items-center text-base font-medium">
        Uitzonderingen op tarieven
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        <p className="text-sm text-zinc-500">Leeg = {fallback}.</p>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Verplaatsingen</span>
          <select name="travelMethod" defaultValue={values.travelMethod} className={inputClass}>
            <option value="">Geen uitzondering</option>
            {(Object.keys(TRAVEL_METHOD_LABELS) as TravelMethod[]).map((method) => (
              <option key={method} value={method}>
                {TRAVEL_METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium">Bedrag per km</span>
            <input
              name="kmRate"
              inputMode="decimal"
              defaultValue={values.kmRate}
              placeholder="leeg"
              autoComplete="off"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium">Bedrag per rit</span>
            <input
              name="tripFlat"
              inputMode="decimal"
              defaultValue={values.tripFlat}
              placeholder="leeg"
              autoComplete="off"
              className={inputClass}
            />
          </label>
        </div>
        {showMargin && (
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium">Marge op materiaal (%)</span>
            <input
              name="materialMargin"
              inputMode="decimal"
              defaultValue={values.materialMargin}
              placeholder="leeg"
              autoComplete="off"
              className={inputClass}
            />
          </label>
        )}
        <p className="text-sm text-zinc-500">
          Bedragen excl. btw. Wat al geregistreerd is, houdt zijn tarief.
        </p>
      </div>
    </details>
  );
}
