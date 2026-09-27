import { deleteTimeEntry, stopTimeEntry } from "@/app/(app)/uren/actions";
import { ActionButton } from "@/components/action-button";
import { ElapsedTime } from "@/components/clock";
import { dangerButtonClass, secondaryButtonClass } from "@/components/form";
import { EmptyState, cardClass } from "@/components/page";
import { Disclosure } from "@/components/disclosure";
import { entryTotals, sumEntries } from "@/lib/hours/totals";
import { cents, formatEuro } from "@/lib/money";
import { formatDate } from "@/lib/dates";
import { formatDuration, toBrusselsDate, toBrusselsTime } from "@/lib/time";
import { TimeEntryForm } from "./time-entry-form";

export type JobHoursEntry = {
  id: string;
  userId: string;
  userName: string;
  startedAt: string;
  endedAt: string | null;
  hourlyRateCents: number;
  note: string | null;
};

/** The hours on a job: totals, the list, and manual entry. Clocking is at the top of the page. */
export function JobHours({
  jobId,
  entries,
  currentUserId,
  showNames,
}: {
  jobId: string;
  entries: JobHoursEntry[];
  currentUserId: string;
  showNames: boolean;
}) {
  const totals = sumEntries(
    entries.map((entry) => ({
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      hourlyRateCents: entry.hourlyRateCents,
    })),
  );
  const today = toBrusselsDate(new Date().toISOString());

  return (
    <section aria-label="Uren" className="flex flex-col gap-4">
      <h2 className="sr-only">Uren</h2>

      <p className="text-lg">
        Totaal: <strong>{formatDuration(totals.minutes)}</strong> ·{" "}
        <strong>{formatEuro(totals.amount)}</strong>
      </p>

      {entries.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {entries.map((entry) => {
            const { minutes, amount } = entryTotals(entry);
            const running = entry.endedAt === null;
            return (
              <li key={entry.id} className={cardClass}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold">
                    {formatDate(toBrusselsDate(entry.startedAt))} ·{" "}
                    {toBrusselsTime(entry.startedAt)}–
                    {entry.endedAt ? toBrusselsTime(entry.endedAt) : "nu"}
                  </span>
                  <span className="text-lg tabular-nums">
                    {running ? (
                      <ElapsedTime startedAt={entry.startedAt} />
                    ) : (
                      formatDuration(minutes)
                    )}{" "}
                    · {formatEuro(amount)}
                  </span>
                </div>
                <p className="text-base text-stone-600 dark:text-stone-400">
                  {[
                    showNames ? entry.userName : null,
                    `${formatEuro(cents(entry.hourlyRateCents))}/u`,
                    entry.note,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {running && entry.userId !== currentUserId && (
                  <ActionButton
                    action={stopTimeEntry}
                    values={{ id: entry.id }}
                    label={`Klok van ${entry.userName} stoppen`}
                    pendingLabel="Bezig…"
                    className={secondaryButtonClass}
                    confirm={`De klok van ${entry.userName} nu stoppen? Je kan het einduur daarna nog aanpassen.`}
                  />
                )}
                <Disclosure
                  variant="inline"
                  summary={running ? "Einduur invullen" : "Aanpassen of verwijderen"}
                >
                  <TimeEntryForm
                    entry={{
                      id: entry.id,
                      jobId,
                      date: toBrusselsDate(entry.startedAt),
                      from: toBrusselsTime(entry.startedAt),
                      until: entry.endedAt ? toBrusselsTime(entry.endedAt) : "",
                      note: entry.note ?? "",
                    }}
                  />
                  <ActionButton
                    action={deleteTimeEntry}
                    values={{ id: entry.id }}
                    label="Verwijderen"
                    pendingLabel="Bezig…"
                    className={dangerButtonClass}
                    confirm="Deze uren verwijderen?"
                  />
                </Disclosure>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>Nog geen uren op deze job.</EmptyState>
      )}

      <Disclosure summary="Uren met de hand toevoegen">
        <TimeEntryForm entry={{ jobId, date: today, from: "", until: "", note: "" }} />
      </Disclosure>
    </section>
  );
}
