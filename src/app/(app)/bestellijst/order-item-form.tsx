"use client";

import { useActionState, useRef } from "react";
import { addOrderItem } from "./actions";
import { FormMessage, inputClass, primaryButtonClass } from "@/components/form";
import { idleFormState } from "@/lib/forms";

export type OrderMaterialOption = {
  id: string;
  name: string;
  unit: string;
  supplier: string | null;
};

export type OrderJobOption = { id: string; title: string };

/**
 * Put something on the order list. Picking from the catalogue fills in the name, unit and
 * supplier, which can still be changed. On a job page the job is fixed; on the list itself
 * a job can be chosen.
 */
export function OrderItemForm({
  materials,
  jobs,
  jobId,
}: {
  materials: OrderMaterialOption[];
  jobs?: OrderJobOption[];
  jobId?: string;
}) {
  const [state, formAction, pending] = useActionState(addOrderItem, idleFormState);
  const values = state.status === "error" ? (state.values ?? {}) : {};
  const description = useRef<HTMLInputElement>(null);
  const unit = useRef<HTMLInputElement>(null);
  const supplier = useRef<HTMLInputElement>(null);

  function pick(materialId: string) {
    const material = materials.find((option) => option.id === materialId);
    if (!material || !description.current || !unit.current || !supplier.current) {
      return;
    }
    description.current.value = material.name;
    unit.current.value = material.unit;
    supplier.current.value = material.supplier ?? "";
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {materials.length > 0 && (
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Uit de catalogus</span>
          <select
            name="materialId"
            defaultValue={values.materialId ?? ""}
            onChange={(event) => pick(event.target.value)}
            className={inputClass}
          >
            <option value="">Iets anders</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Wat</span>
        <input
          ref={description}
          name="description"
          required
          maxLength={200}
          defaultValue={values.description ?? ""}
          placeholder="bv. Silicone transparant"
          autoComplete="off"
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Aantal</span>
          <input
            name="quantity"
            required
            inputMode="decimal"
            defaultValue={values.quantity ?? ""}
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-base font-medium">Eenheid</span>
          <input
            ref={unit}
            name="unit"
            required
            maxLength={30}
            defaultValue={values.unit ?? "stuk"}
            autoComplete="off"
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">Leverancier</span>
        <input
          ref={supplier}
          name="supplier"
          maxLength={200}
          defaultValue={values.supplier ?? ""}
          autoComplete="off"
          className={inputClass}
        />
      </label>
      {jobId ? (
        <input type="hidden" name="jobId" value={jobId} />
      ) : (
        jobs && (
          <label className="flex flex-col gap-2">
            <span className="text-base font-medium">Voor job</span>
            <select name="jobId" defaultValue={values.jobId ?? ""} className={inputClass}>
              <option value="">Geen bepaalde job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
          </label>
        )
      )}
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Bezig…" : "Op de bestellijst"}
      </button>
    </form>
  );
}
