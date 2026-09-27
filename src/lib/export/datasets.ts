import "server-only";
import { entryTotals } from "@/lib/hours/totals";
import {
  CUSTOMER_TYPE_LABELS,
  JOB_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  TRAVEL_METHOD_LABELS,
} from "@/lib/labels";
import { usageCost } from "@/lib/materials/totals";
import { documentTotals, lineNet } from "@/lib/quotes/totals";
import type { createClient } from "@/lib/supabase/server";
import { toBrusselsDate, toBrusselsTime } from "@/lib/time";
import { tripCost } from "@/lib/trips/totals";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { centsToEuros, type CsvCell } from "./csv";

type Client = Awaited<ReturnType<typeof createClient>>;

export type ExportTable = { headers: string[]; rows: CsvCell[][] };

export type ExportDataset = {
  label: string;
  description: string;
  load: (supabase: Client) => Promise<ExportTable>;
};

function basisPointsToPercent(value: number | null): number | null {
  return value === null ? null : value / 100;
}

async function memberNames(supabase: Client): Promise<Map<string, string>> {
  const { data, error } = await supabase.from("app_users").select("user_id, display_name");
  if (error) {
    throw new Error(`Export failed: ${error.message}`);
  }
  return new Map(data.map((member) => [member.user_id, member.display_name]));
}

export const EXPORT_DATASETS = {
  klanten: {
    label: "Klanten",
    description: "Alle klanten, ook gearchiveerde.",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase.from("customers").select("*").order("name").order("id").range(from, to),
      );
      return {
        headers: [
          "Naam",
          "Soort",
          "Btw-nummer",
          "E-mail",
          "Telefoon",
          "Adres",
          "Postcode",
          "Gemeente",
          "Land",
          "Notities",
          "Gearchiveerd",
        ],
        rows: rows.map((row) => [
          row.name,
          CUSTOMER_TYPE_LABELS[row.type],
          row.vat_number,
          row.email,
          row.phone,
          row.address_line,
          row.postal_code,
          row.city,
          row.country,
          row.notes,
          row.archived_at ? toBrusselsDate(row.archived_at) : null,
        ]),
      };
    },
  },
  jobs: {
    label: "Jobs",
    description: "Alle jobs met klant, status en periode.",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase
          .from("jobs")
          .select("*, customers(name)")
          .order("created_at")
          .order("id")
          .range(from, to),
      );
      return {
        headers: [
          "Job",
          "Klant",
          "Status",
          "Start",
          "Einde",
          "Adres",
          "Postcode",
          "Gemeente",
          "Omschrijving",
          "Btw-tarief",
        ],
        rows: rows.map((row) => [
          row.title,
          row.customers?.name ?? null,
          JOB_STATUS_LABELS[row.status],
          row.starts_on,
          row.ends_on,
          row.address_line,
          row.postal_code,
          row.city,
          row.description,
          row.vat_rate,
        ]),
      };
    },
  },
  uren: {
    label: "Uren",
    description: "Alle geregistreerde uren met tarief en bedrag (excl. btw).",
    async load(supabase) {
      const [rows, names] = await Promise.all([
        fetchAll((from, to) =>
          supabase
            .from("time_entries")
            .select("*, jobs(title)")
            .order("started_at")
            .order("id")
            .range(from, to),
        ),
        memberNames(supabase),
      ]);
      return {
        headers: [
          "Datum",
          "Van",
          "Tot",
          "Minuten",
          "Job",
          "Wie",
          "Uurtarief (€)",
          "Bedrag (€)",
          "Notitie",
        ],
        rows: rows.map((row) => {
          const totals = entryTotals({
            startedAt: row.started_at,
            endedAt: row.ended_at,
            hourlyRateCents: row.hourly_rate_cents,
          });
          return [
            toBrusselsDate(row.started_at),
            toBrusselsTime(row.started_at),
            row.ended_at ? toBrusselsTime(row.ended_at) : "loopt nog",
            totals.minutes,
            row.jobs?.title ?? null,
            names.get(row.user_id) ?? "Oud-lid",
            centsToEuros(row.hourly_rate_cents),
            centsToEuros(totals.amount),
            row.note,
          ];
        }),
      };
    },
  },
  materiaal: {
    label: "Materiaalcatalogus",
    description: "Alle materiaal met verpakking, prijs en marge.",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase.from("materials").select("*").order("name").order("id").range(from, to),
      );
      return {
        headers: [
          "Naam",
          "Eenheid",
          "Prijs verpakking (€)",
          "Aantal per verpakking",
          "Leverancier",
          "Marge (%)",
          "Gearchiveerd",
        ],
        rows: rows.map((row) => [
          row.name,
          row.unit,
          centsToEuros(row.package_price_cents),
          row.units_per_package,
          row.supplier,
          basisPointsToPercent(row.margin_bp),
          row.archived_at ? toBrusselsDate(row.archived_at) : null,
        ]),
      };
    },
  },
  "materiaal-per-job": {
    label: "Materiaal per job",
    description: "Al het gebruikte materiaal met kostprijs (excl. btw).",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase
          .from("material_usages")
          .select("*, jobs(title)")
          .order("used_on")
          .order("id")
          .range(from, to),
      );
      return {
        headers: [
          "Datum",
          "Job",
          "Omschrijving",
          "Aantal",
          "Eenheid",
          "Prijs verpakking (€)",
          "Aantal per verpakking",
          "Kostprijs (€)",
          "Marge (%)",
        ],
        rows: rows.map((row) => [
          row.used_on,
          row.jobs?.title ?? null,
          row.description,
          row.quantity,
          row.unit,
          centsToEuros(row.package_price_cents),
          row.units_per_package,
          centsToEuros(
            usageCost({
              packagePriceCents: row.package_price_cents,
              unitsPerPackage: row.units_per_package,
              quantity: row.quantity,
            }),
          ),
          basisPointsToPercent(row.margin_bp),
        ]),
      };
    },
  },
  ritten: {
    label: "Verplaatsingen",
    description: "Alle ritten met afstand, tarief en bedrag (excl. btw).",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase
          .from("trips")
          .select("*, jobs(title)")
          .order("trip_date")
          .order("id")
          .range(from, to),
      );
      return {
        headers: ["Datum", "Job", "Manier", "Km", "Tarief (€)", "Bedrag (€)", "Notitie"],
        rows: rows.map((row) => {
          if (row.method === "included") {
            throw new Error(`Trip ${row.id} has method "included"`);
          }
          return [
            row.trip_date,
            row.jobs?.title ?? null,
            TRAVEL_METHOD_LABELS[row.method],
            row.distance_km,
            centsToEuros(row.rate_cents),
            centsToEuros(
              tripCost({
                method: row.method,
                distanceKm: row.distance_km,
                rateCents: row.rate_cents,
              }),
            ),
            row.note,
          ];
        }),
      };
    },
  },
  taken: {
    label: "Taken",
    description: "Alle taken per job, open en afgewerkt.",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase
          .from("job_tasks")
          .select("*, jobs(title)")
          .order("created_at")
          .order("id")
          .range(from, to),
      );
      return {
        headers: ["Job", "Taak", "Aangemaakt", "Afgewerkt"],
        rows: rows.map((row) => [
          row.jobs?.title ?? null,
          row.title,
          toBrusselsDate(row.created_at),
          row.done_at ? toBrusselsDate(row.done_at) : null,
        ]),
      };
    },
  },
  notities: {
    label: "Notities",
    description: "Alle notities per job, met datum en wie ze schreef.",
    async load(supabase) {
      const [names, rows] = await Promise.all([
        memberNames(supabase),
        fetchAll((from, to) =>
          supabase
            .from("job_notes")
            .select("*, jobs(title)")
            .order("created_at")
            .order("id")
            .range(from, to),
        ),
      ]);
      return {
        headers: ["Datum", "Job", "Door", "Notitie"],
        rows: rows.map((row) => [
          toBrusselsDate(row.created_at),
          row.jobs?.title ?? null,
          names.get(row.created_by) ?? null,
          row.body,
        ]),
      };
    },
  },
  offertes: {
    label: "Offertes",
    description: "Alle offertes met status en totalen.",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase
          .from("quotes")
          .select(
            "*, jobs(title, customers(name)), quote_lines(quantity, unit_price_cents, vat_rate)",
          )
          .order("number")
          .order("id")
          .range(from, to),
      );
      return {
        headers: [
          "Nummer",
          "Datum",
          "Geldig tot",
          "Status",
          "Job",
          "Klant",
          "Totaal excl. btw (€)",
          "Btw (€)",
          "Totaal incl. btw (€)",
        ],
        rows: rows.map((row) => {
          const totals = documentTotals(
            row.quote_lines.map((line) => ({
              quantity: line.quantity,
              unitPriceCents: line.unit_price_cents,
              vatRate: line.vat_rate,
            })),
          );
          return [
            row.number,
            row.quote_date,
            row.valid_until,
            QUOTE_STATUS_LABELS[row.status],
            row.jobs?.title ?? null,
            row.jobs?.customers?.name ?? null,
            centsToEuros(totals.totalNet),
            centsToEuros(totals.totalVat),
            centsToEuros(totals.totalGross),
          ];
        }),
      };
    },
  },
  offerteregels: {
    label: "Offerteregels",
    description: "Elke regel van elke offerte.",
    async load(supabase) {
      const rows = await fetchAll((from, to) =>
        supabase
          .from("quote_lines")
          .select("*, quotes(number)")
          .order("created_at")
          .order("id")
          .range(from, to),
      );
      return {
        headers: [
          "Offerte",
          "Omschrijving",
          "Aantal",
          "Eenheid",
          "Prijs per eenheid (€)",
          "Btw (%)",
          "Totaal excl. btw (€)",
        ],
        rows: rows.map((row) => [
          row.quotes?.number ?? null,
          row.description,
          row.quantity,
          row.unit,
          centsToEuros(row.unit_price_cents),
          row.vat_rate,
          centsToEuros(
            lineNet({
              quantity: row.quantity,
              unitPriceCents: row.unit_price_cents,
              vatRate: row.vat_rate,
            }),
          ),
        ]),
      };
    },
  },
} satisfies Record<string, ExportDataset>;

export type ExportDatasetKey = keyof typeof EXPORT_DATASETS;

export function isExportDatasetKey(key: string): key is ExportDatasetKey {
  return Object.hasOwn(EXPORT_DATASETS, key);
}
