"use client";

import { useActionState } from "react";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { saveMaterial } from "./actions";

export type MaterialFormValues = {
  id?: string;
  name: string;
  unit: string;
  packagePrice: string;
  unitsPerPackage: string;
  supplier: string;
};

export const emptyMaterial: MaterialFormValues = {
  name: "",
  unit: "stuk",
  packagePrice: "",
  unitsPerPackage: "1",
  supplier: "",
};

/** Units a carpenter often uses; any other unit can be typed. */
const UNIT_SUGGESTIONS = ["stuk", "m", "m²", "m³", "plaat", "liter", "kg", "rol", "pak"];

export function MaterialForm({ material }: { material: MaterialFormValues }) {
  const [state, formAction, pending] = useActionState(saveMaterial, idleFormState);
  const values =
    state.status === "error" && state.values ? { ...material, ...state.values } : material;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {material.id && <input type="hidden" name="id" value={material.id} />}
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Naam</span>
        <input
          name="name"
          required
          defaultValue={values.name}
          placeholder="bv. Vijzen 4x40"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Prijs verpakking</span>
          <input
            name="packagePrice"
            required
            inputMode="decimal"
            defaultValue={values.packagePrice}
            placeholder="12,50"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Aantal per verpakking</span>
          <input
            name="unitsPerPackage"
            required
            inputMode="decimal"
            defaultValue={values.unitsPerPackage}
            placeholder="200"
            autoComplete="off"
            className={inputClass}
          />
        </label>
      </div>
      <p className="-mt-2 text-sm text-zinc-500">
        Prijs excl. btw. Bv. een doos van 200 vijzen voor 12,50. Koop je per stuk, laat dan 1 staan.
      </p>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Eenheid</span>
        <input
          name="unit"
          required
          list="material-units"
          defaultValue={values.unit}
          autoComplete="off"
          className={inputClass}
        />
        <datalist id="material-units">
          {UNIT_SUGGESTIONS.map((unit) => (
            <option key={unit} value={unit} />
          ))}
        </datalist>
        <span className="text-sm text-zinc-500">Waarin je telt: stuk, m, plaat, …</span>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Leverancier</span>
        <input
          name="supplier"
          defaultValue={values.supplier}
          autoComplete="off"
          className={inputClass}
        />
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig met opslaan…" : material.id ? "Opslaan" : "Materiaal toevoegen"}
      </button>
    </form>
  );
}
