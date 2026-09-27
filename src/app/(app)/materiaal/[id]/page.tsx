import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { secondaryButtonClass } from "@/components/form";
import { EmptyState, PageHeader, cardClass, pageClass, textLinkClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { jobTabHref } from "@/lib/jobs/tabs";
import { formatDate } from "@/lib/dates";
import { describePrice } from "@/lib/materials/format";
import { cents, formatEuroInput } from "@/lib/money";
import { formatQuantity, formatQuantityInput } from "@/lib/quantity";
import { marginFormValue } from "@/lib/rates/overrides";
import { createClient } from "@/lib/supabase/server";
import { setMaterialArchived } from "../actions";
import { MaterialForm } from "../material-form";

export const metadata: Metadata = { title: "Materiaal · Schrijnwerk" };

/** How many recent jobs the page shows for a material. */
const RECENT_USAGES = 20;

export default async function MaterialPage({ params }: PageProps<"/materiaal/[id]">) {
  await requireMember();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) {
    notFound();
  }

  const supabase = await createClient();
  const [{ data: material, error }, { data: usages, error: usagesError }] = await Promise.all([
    supabase.from("materials").select("*").eq("id", id.data).maybeSingle(),
    supabase
      .from("material_usages")
      .select("id, quantity, unit, used_on, jobs(id, title)")
      .eq("material_id", id.data)
      .order("used_on", { ascending: false })
      .limit(RECENT_USAGES),
  ]);
  if (error || usagesError) {
    throw new Error(`Could not load material: ${(error ?? usagesError)?.message}`);
  }
  if (!material) {
    notFound();
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title={material.name}
        back={{ href: "/materiaal", label: "Materiaal" }}
        description={
          <span className="flex flex-col gap-1">
            <span>
              {describePrice({
                packagePriceCents: material.package_price_cents,
                unitsPerPackage: material.units_per_package,
                unit: material.unit,
              })}
              {material.archived_at && " · gearchiveerd"}
            </span>
            {material.supplier && <span>{material.supplier}</span>}
          </span>
        }
      />

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Gegevens bewerken</h2>
          <div className={cardClass}>
            <MaterialForm
              material={{
                id: material.id,
                name: material.name,
                unit: material.unit,
                packagePrice: formatEuroInput(cents(material.package_price_cents)),
                unitsPerPackage: formatQuantityInput(material.units_per_package),
                supplier: material.supplier ?? "",
                margin: marginFormValue(material.margin_bp),
              }}
            />
          </div>
          <ActionButton
            action={setMaterialArchived}
            values={{ id: material.id, archive: material.archived_at ? "false" : "true" }}
            label={material.archived_at ? "Terugzetten in de lijst" : "Archiveren"}
            pendingLabel="Bezig…"
            className={secondaryButtonClass}
            confirm={
              material.archived_at
                ? undefined
                : `${material.name} archiveren? Het verdwijnt uit de lijst, maar jobs die het gebruikten houden het.`
            }
          />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Laatst gebruikt op</h2>
          {usages.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {usages.map((usage) => (
                <li key={usage.id} className="text-lg">
                  {formatDate(usage.used_on)} · {formatQuantity(usage.quantity)} {usage.unit}
                  {usage.jobs && (
                    <>
                      {" · "}
                      <Link href={jobTabHref(usage.jobs.id, "materiaal")} className={textLinkClass}>
                        {usage.jobs.title}
                      </Link>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState>Nog op geen enkele job gebruikt.</EmptyState>
          )}
        </section>
      </div>
    </main>
  );
}
