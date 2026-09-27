"use client";

import { useActionState, useState } from "react";
import { addCatalogUsage, addOtherUsage, updateUsage } from "@/app/(app)/materiaal/usage-actions";
import {
  FormMessage,
  choiceClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { formatQuantity } from "@/lib/quantity";

export type MaterialOption = {
  id: string;
  name: string;
  unit: string;
  unitsPerPackage: number;
  priceLabel: string;
};

function DateField({ defaultValue }: { defaultValue: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-medium">Datum</span>
      <input
        type="date"
        name="usedOn"
        required
        defaultValue={defaultValue}
        className={inputClass}
      />
    </label>
  );
}

function QuantityField({ defaultValue }: { defaultValue: string | undefined }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-base font-medium">Aantal</span>
      <input
        name="quantity"
        required
        inputMode="decimal"
        defaultValue={defaultValue}
        autoComplete="off"
        className={inputClass}
      />
    </label>
  );
}

/** Material from the catalogue: pick it, type how many, done. */
export function CatalogUsageForm({
  jobId,
  materials,
  today,
}: {
  jobId: string;
  materials: MaterialOption[];
  today: string;
}) {
  const [state, formAction, pending] = useActionState(addCatalogUsage, idleFormState);
  const values = state.status === "error" ? state.values : undefined;
  const [materialId, setMaterialId] = useState(values?.materialId ?? "");
  const material = materials.find((option) => option.id === materialId);
  const hasPackage = material !== undefined && material.unitsPerPackage !== 1;

  return (
    <form
      action={formAction}
      // React empties the form after a successful action; forget the chosen material too.
      onReset={() => setMaterialId("")}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="jobId" value={jobId} />
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Materiaal</span>
        <select
          name="materialId"
          required
          defaultValue={materialId}
          onChange={(event) => setMaterialId(event.target.value)}
          className={inputClass}
        >
          <option value="">Kies…</option>
          {materials.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {material && <span className="text-sm text-stone-500">{material.priceLabel}</span>}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <QuantityField defaultValue={values?.quantity} />
        <DateField defaultValue={values?.usedOn ?? today} />
      </div>
      {hasPackage ? (
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">Geteld per</legend>
          {(
            [
              ["unit", `per ${material.unit}`],
              ["package", `per verpakking (${formatQuantity(material.unitsPerPackage)})`],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={`${choiceClass} text-base`}>
              <input
                type="radio"
                name="per"
                value={value}
                defaultChecked={(values?.per ?? "unit") === value}
                className="size-5"
              />
              {label}
            </label>
          ))}
        </fieldset>
      ) : (
        <input type="hidden" name="per" value="unit" />
      )}
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met toevoegen…" : "Materiaal toevoegen"}
      </button>
    </form>
  );
}

/** Something bought for this job only, not in the catalogue. */
export function OtherUsageForm({ jobId, today }: { jobId: string; today: string }) {
  const [state, formAction, pending] = useActionState(addOtherUsage, idleFormState);
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="jobId" value={jobId} />
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Omschrijving</span>
        <input
          name="description"
          required
          defaultValue={values?.description}
          placeholder="bv. Werkbladolie"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <QuantityField defaultValue={values?.quantity ?? "1"} />
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Eenheid</span>
          <input
            name="unit"
            required
            defaultValue={values?.unit ?? "stuk"}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Prijs per eenheid</span>
          <input
            name="unitPrice"
            required
            inputMode="decimal"
            defaultValue={values?.unitPrice}
            placeholder="18,99"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <DateField defaultValue={values?.usedOn ?? today} />
      </div>
      <p className="-mt-2 text-sm text-stone-500">Prijs excl. btw.</p>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={secondaryButtonClass}>
        {pending ? "Bezig met toevoegen…" : "Toevoegen"}
      </button>
    </form>
  );
}

/** Correct the quantity or date of an entry. */
export function UsageUpdateForm({
  id,
  quantity,
  unit,
  usedOn,
}: {
  id: string;
  quantity: string;
  unit: string;
  usedOn: string;
}) {
  const [state, formAction, pending] = useActionState(updateUsage, idleFormState);
  const values = state.status === "error" ? state.values : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Aantal ({unit})</span>
          <input
            name="quantity"
            required
            inputMode="decimal"
            defaultValue={values?.quantity ?? quantity}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <DateField defaultValue={values?.usedOn ?? usedOn} />
      </div>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={secondaryButtonClass}>
        {pending ? "Bezig met opslaan…" : "Aanpassing opslaan"}
      </button>
    </form>
  );
}
