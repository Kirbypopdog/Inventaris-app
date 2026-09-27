import type { Metadata } from "next";
import { ActionButton } from "@/components/action-button";
import { Checklist, type ChecklistItem } from "@/components/checklist";
import { CopyButton } from "@/components/copy-button";
import { Disclosure } from "@/components/disclosure";
import { secondaryButtonClass } from "@/components/form";
import { EmptyState, PageHeader, pageClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { OPEN_JOB_STATUSES } from "@/lib/labels";
import { type OrderItem, groupBySupplier, orderText } from "@/lib/orders/group";
import { formatQuantity } from "@/lib/quantity";
import { createClient } from "@/lib/supabase/server";
import { clearOrdered, setOrdered } from "./actions";
import { OrderItemForm } from "./order-item-form";

export const metadata: Metadata = { title: "Bestellijst · Schrijnwerk" };

function toChecklistItem(item: OrderItem): ChecklistItem {
  return {
    id: item.id,
    title: `${formatQuantity(item.quantity)} ${item.unit} ${item.description}`,
    detail: item.jobTitle ? `Voor ${item.jobTitle}` : null,
    done: item.ordered,
  };
}

export default async function OrderListPage() {
  await requireMember();
  const supabase = await createClient();
  const [itemsResult, materialsResult, jobsResult] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, description, quantity, unit, supplier, ordered_at, jobs(title)")
      .order("created_at"),
    supabase
      .from("materials")
      .select("id, name, unit, supplier")
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("jobs")
      .select("id, title")
      .in("status", [...OPEN_JOB_STATUSES])
      .order("title"),
  ]);
  if (itemsResult.error || materialsResult.error || jobsResult.error) {
    const loadError = itemsResult.error ?? materialsResult.error ?? jobsResult.error;
    throw new Error(`Could not load order list: ${loadError?.message}`);
  }

  const items: OrderItem[] = itemsResult.data.map((row) => ({
    id: row.id,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    supplier: row.supplier,
    jobTitle: row.jobs?.title ?? null,
    ordered: row.ordered_at !== null,
  }));
  const open = items.filter((item) => !item.ordered);
  const ordered = items.filter((item) => item.ordered);

  return (
    <main className={pageClass}>
      <PageHeader
        title="Bestellijst"
        back={{ href: "/materiaal", label: "Materiaal" }}
        description="Wat nog besteld moet worden, per leverancier. Vink af wat besteld is."
      />

      <div className="md:max-w-2xl">
        <Disclosure summary="+ Iets op de lijst zetten" open={items.length === 0}>
          <OrderItemForm materials={materialsResult.data} jobs={jobsResult.data} />
        </Disclosure>
      </div>

      {open.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {groupBySupplier(open).map((group) => {
            const name = group.supplier ?? "Zonder leverancier";
            return (
              <section key={name} aria-label={name} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="min-w-0 text-xl font-semibold break-words">{name}</h2>
                  <CopyButton text={orderText(group.items)} label="Kopieer lijst" />
                </div>
                <Checklist
                  items={group.items.map(toChecklistItem)}
                  label={`Te bestellen bij ${name}`}
                  toggle={setOrdered}
                />
              </section>
            );
          })}
        </div>
      ) : (
        items.length > 0 && <EmptyState>Alles is besteld.</EmptyState>
      )}

      {ordered.length > 0 && (
        <div className="md:max-w-2xl">
          <Disclosure summary={`Besteld (${ordered.length})`}>
            <Checklist items={ordered.map(toChecklistItem)} label="Besteld" toggle={setOrdered} />
            <ActionButton
              action={clearOrdered}
              values={{}}
              label="Bestelde regels wissen"
              pendingLabel="Bezig…"
              className={secondaryButtonClass}
              confirm="De bestelde regels wissen?"
            />
          </Disclosure>
        </div>
      )}
    </main>
  );
}
