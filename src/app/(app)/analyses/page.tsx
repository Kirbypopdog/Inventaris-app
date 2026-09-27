import type { Metadata } from "next";
import Link from "next/link";
import { JobCalculationSummary } from "@/components/job-calculation";
import {
  EmptyState,
  PageHeader,
  cardClass,
  pageClass,
  secondaryLinkButtonClass,
} from "@/components/page";
import { jobCalculation, monthlyTotals } from "@/lib/analyses";
import { loadAnalysisData } from "@/lib/analyses-queries";
import { requireMember } from "@/lib/auth/session";
import { add, formatEuro } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { formatDuration, toBrusselsDate } from "@/lib/time";

export const metadata: Metadata = { title: "Analyses · Schrijnwerk" };

const MONTHS = [
  "januari",
  "februari",
  "maart",
  "april",
  "mei",
  "juni",
  "juli",
  "augustus",
  "september",
  "oktober",
  "november",
  "december",
];

export default async function AnalysesPage({ searchParams }: PageProps<"/analyses">) {
  await requireMember();
  const currentYear = Number(toBrusselsDate(new Date().toISOString()).slice(0, 4));
  const requested = (await searchParams).jaar;
  const year =
    typeof requested === "string" && /^\d{4}$/.test(requested) ? Number(requested) : currentYear;

  const supabase = await createClient();
  const data = await loadAnalysisData(supabase);
  const months = monthlyTotals(year, data.entries, data.usages, data.trips);
  const yearTotals = {
    minutes: months.reduce((sum, month) => sum + month.minutes, 0),
    labour: add(...months.map((month) => month.labour)),
    materialCost: add(...months.map((month) => month.materialCost)),
    travel: add(...months.map((month) => month.travel)),
  };

  // Jobs with hours, material or trips in this year; the calculation covers the whole job.
  const yearPrefix = String(year);
  const activeJobIds = [...data.byJob.entries()]
    .filter(
      ([, activity]) =>
        activity.entries.some((entry) => toBrusselsDate(entry.startedAt).startsWith(yearPrefix)) ||
        activity.usages.some((usage) => usage.usedOn.startsWith(yearPrefix)) ||
        activity.trips.some((trip) => trip.tripDate.startsWith(yearPrefix)),
    )
    .map(([jobId]) => jobId);
  const { data: jobs, error } = activeJobIds.length
    ? await supabase.from("jobs").select("id, title, customers(name)").in("id", activeJobIds)
    : { data: [], error: null };
  if (error) {
    throw new Error(`Could not load jobs: ${error.message}`);
  }
  const jobCalculations = jobs
    .map((job) => {
      const activity = data.byJob.get(job.id);
      return {
        job,
        calculation: jobCalculation(
          activity ?? { entries: [], usages: [], trips: [], acceptedQuoteLines: [] },
        ),
      };
    })
    .sort((a, b) => b.calculation.total - a.calculation.total);

  return (
    <main className={pageClass}>
      <PageHeader
        title={`Analyses ${year}`}
        description="Wat er gepresteerd is, per maand en per job. Bedragen excl. btw."
      />
      <nav aria-label="Ander jaar" className="grid grid-cols-3 gap-3 md:max-w-lg">
        <Link href={`/analyses?jaar=${year - 1}`} className={secondaryLinkButtonClass}>
          ← {year - 1}
        </Link>
        <Link href="/analyses" className={secondaryLinkButtonClass}>
          Dit jaar
        </Link>
        <Link href={`/analyses?jaar=${year + 1}`} className={secondaryLinkButtonClass}>
          {year + 1} →
        </Link>
      </nav>

      <section className="flex flex-col gap-4" aria-label="Per maand">
        <h2 className="text-xl font-semibold">Per maand</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-base">
            <thead className="text-sm text-stone-600 dark:text-stone-400">
              <tr>
                <th className="py-2 pr-3 font-medium">Maand</th>
                <th className="py-2 pr-3 text-right font-medium">Uren</th>
                <th className="py-2 pr-3 text-right font-medium">Bedrag uren</th>
                <th className="py-2 pr-3 text-right font-medium">Materiaal</th>
                <th className="py-2 text-right font-medium">Verplaatsingen</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {months.map((month) => (
                <tr key={month.month} className="border-t border-stone-200 dark:border-stone-800">
                  <td className="py-2 pr-3">{MONTHS[month.month - 1]}</td>
                  <td className="py-2 pr-3 text-right">{formatDuration(month.minutes)}</td>
                  <td className="py-2 pr-3 text-right">{formatEuro(month.labour)}</td>
                  <td className="py-2 pr-3 text-right">{formatEuro(month.materialCost)}</td>
                  <td className="py-2 text-right">{formatEuro(month.travel)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-stone-400 font-semibold dark:border-stone-600">
                <td className="py-2 pr-3">Totaal</td>
                <td className="py-2 pr-3 text-right">{formatDuration(yearTotals.minutes)}</td>
                <td className="py-2 pr-3 text-right">{formatEuro(yearTotals.labour)}</td>
                <td className="py-2 pr-3 text-right">{formatEuro(yearTotals.materialCost)}</td>
                <td className="py-2 text-right">{formatEuro(yearTotals.travel)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-stone-500">Materiaal tegen kostprijs.</p>
      </section>

      <section className="flex flex-col gap-4" aria-label="Per job">
        <h2 className="text-xl font-semibold">Nacalculatie per job</h2>
        {jobCalculations.length > 0 ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {jobCalculations.map(({ job, calculation }) => (
              <li key={job.id} className={cardClass}>
                <Link href={`/jobs/${job.id}`} className="text-lg font-semibold underline">
                  {job.title}
                </Link>
                {job.customers && (
                  <p className="-mt-3 text-base text-stone-600 dark:text-stone-400">
                    {job.customers.name}
                  </p>
                )}
                <JobCalculationSummary calculation={calculation} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Geen uren, materiaal of verplaatsingen in {year}.</EmptyState>
        )}
      </section>
    </main>
  );
}
