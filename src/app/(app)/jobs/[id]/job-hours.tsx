import { clockIn, clockOut, deleteTimeEntry, stopTimeEntry } from "@/app/(app)/uren/actions";
import { ActionButton } from "@/components/action-button";
import { ElapsedTime } from "@/components/clock";
import { dangerButtonClass, secondaryButtonClass } from "@/components/form";
import { EmptyState, cardClass } from "@/components/page";
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

const clockButtonClass =
  "min-h-16 w-full rounded-2xl px-4 text-lg font-semibold text-white disabled:opacity-60";

/** Clock button for this job, the list of hours, totals and manual entry. */
export function JobHours({
  jobId,
  jobIsOpen,
  entries,
  currentUserId,
  runningHere,
  showNames,
}: {
  jobId: string;
  jobIsOpen: boolean;
  entries: JobHoursEntry[];
  currentUserId: string;
  runningHere: boolean;
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
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Uren</h2>

      {runningHere ? (
        <ActionButton
          action={clockOut}
          values={{}}
          label="Uitklokken"
          pendingLabel="Bezig met uitklokken…"
          className={`${clockButtonClass} bg-red-700 dark:bg-red-600`}
        />
      ) : (
        jobIsOpen && (
          <ActionButton
            action={clockIn}
            values={{ jobId }}
            label="Inklokken op deze job"
            pendingLabel="Bezig met inklokken…"
            className={`${clockButtonClass} bg-green-700 dark:bg-green-600`}
          />
        )
      )}

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
                <p className="text-base text-zinc-600 dark:text-zinc-400">
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
                <details>
                  <summary className="flex min-h-12 cursor-pointer items-center text-base underline">
                    {running ? "Einduur invullen" : "Aanpassen of verwijderen"}
                  </summary>
                  <div className="mt-3 flex flex-col gap-3">
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
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>Nog geen uren op deze job.</EmptyState>
      )}

      <details className={cardClass}>
        <summary className="flex min-h-12 cursor-pointer items-center text-lg font-medium">
          Uren met de hand toevoegen
        </summary>
        <div className="mt-3">
          <TimeEntryForm entry={{ jobId, date: today, from: "", until: "", note: "" }} />
        </div>
      </details>
    </section>
  );
}
