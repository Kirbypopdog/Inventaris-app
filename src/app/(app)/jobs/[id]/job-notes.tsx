import { deleteMeasurement } from "../measurement-actions";
import { clearDoneTasks, deleteNote } from "../notes-actions";
import { ActionButton } from "@/components/action-button";
import { dangerButtonClass, secondaryButtonClass } from "@/components/form";
import { Disclosure } from "@/components/disclosure";
import { EmptyState, cardClass } from "@/components/page";
import { formatDate } from "@/lib/dates";
import { type Dimensions, formatDimensions } from "@/lib/measurements/format";
import { toBrusselsDate } from "@/lib/time";
import { MeasurementForm } from "./measurement-form";
import { NoteForm, TaskAddForm } from "./note-forms";
import { TaskChecklist, type TaskItem } from "./task-list";

export type JobNote = { id: string; body: string; authorName: string; createdAt: string };

export type JobMeasurement = Dimensions & { id: string; label: string; note: string | null };

function sizeInput(mm: number | null): string {
  return mm === null ? "" : String(mm);
}

/** What still has to happen on a job, what was measured, and what to remember about it. */
export function JobNotes({
  jobId,
  tasks,
  measurements,
  notes,
}: {
  jobId: string;
  tasks: TaskItem[];
  measurements: JobMeasurement[];
  notes: JobNote[];
}) {
  const open = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Te doen</h2>
          <TaskAddForm jobId={jobId} />
          {open.length > 0 ? (
            <TaskChecklist tasks={open} label="Open taken" />
          ) : (
            <EmptyState>
              {done.length > 0 ? "Alles is afgewerkt." : "Nog geen taken voor deze job."}
            </EmptyState>
          )}
          {done.length > 0 && (
            <Disclosure summary={`Afgewerkt (${done.length})`}>
              <TaskChecklist tasks={done} label="Afgewerkte taken" />
              <ActionButton
                action={clearDoneTasks}
                values={{ jobId }}
                label="Afgewerkte taken wissen"
                pendingLabel="Bezig…"
                className={secondaryButtonClass}
                confirm="De afgewerkte taken wissen?"
              />
            </Disclosure>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Opmetingen</h2>
          <Disclosure summary="+ Nieuwe opmeting">
            <MeasurementForm
              measurement={{ jobId, label: "", width: "", height: "", depth: "", note: "" }}
            />
          </Disclosure>
          {measurements.length > 0 && (
            <ul aria-label="Opmetingen" className="flex flex-col gap-2">
              {measurements.map((measurement) => (
                <li key={measurement.id}>
                  <Disclosure
                    summary={
                      <span className="flex min-w-0 flex-col py-2">
                        <span className="font-semibold break-words">{measurement.label}</span>
                        <span className="tabular-nums">{formatDimensions(measurement)}</span>
                        {measurement.note && (
                          <span className="text-base font-normal break-words text-stone-600 dark:text-stone-400">
                            {measurement.note}
                          </span>
                        )}
                      </span>
                    }
                  >
                    <MeasurementForm
                      measurement={{
                        id: measurement.id,
                        jobId,
                        label: measurement.label,
                        width: sizeInput(measurement.widthMm),
                        height: sizeInput(measurement.heightMm),
                        depth: sizeInput(measurement.depthMm),
                        note: measurement.note ?? "",
                      }}
                    />
                    <ActionButton
                      action={deleteMeasurement}
                      values={{ id: measurement.id }}
                      label="Verwijderen"
                      pendingLabel="Bezig…"
                      className={dangerButtonClass}
                      confirm="Deze opmeting verwijderen?"
                    />
                  </Disclosure>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Notities</h2>
        <Disclosure summary="+ Nieuwe notitie">
          <NoteForm note={{ jobId, body: "" }} />
        </Disclosure>
        {notes.length > 0 && (
          <ul className="flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id} className={cardClass}>
                <p className="text-sm font-medium text-stone-500">
                  {formatDate(toBrusselsDate(note.createdAt))} · {note.authorName}
                </p>
                <p className="-mt-2 text-lg break-words whitespace-pre-line">{note.body}</p>
                <Disclosure variant="inline" summary="Aanpassen of verwijderen">
                  <NoteForm note={{ id: note.id, jobId, body: note.body }} />
                  <ActionButton
                    action={deleteNote}
                    values={{ id: note.id }}
                    label="Verwijderen"
                    pendingLabel="Bezig…"
                    className={dangerButtonClass}
                    confirm="Deze notitie verwijderen?"
                  />
                </Disclosure>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
