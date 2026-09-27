import { clearDoneTasks, deleteNote } from "../notes-actions";
import { ActionButton } from "@/components/action-button";
import { dangerButtonClass, secondaryButtonClass } from "@/components/form";
import { Disclosure } from "@/components/disclosure";
import { EmptyState, cardClass } from "@/components/page";
import { formatDate } from "@/lib/dates";
import { toBrusselsDate } from "@/lib/time";
import { NoteForm, TaskAddForm } from "./note-forms";
import { TaskChecklist, type TaskItem } from "./task-list";

export type JobNote = { id: string; body: string; authorName: string; createdAt: string };

/** What still has to happen on a job, and what to remember about it. */
export function JobNotes({
  jobId,
  tasks,
  notes,
}: {
  jobId: string;
  tasks: TaskItem[];
  notes: JobNote[];
}) {
  const open = tasks.filter((task) => !task.done);
  const done = tasks.filter((task) => task.done);

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
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
        <h2 className="text-xl font-semibold">Notities</h2>
        <Disclosure summary="+ Nieuwe notitie" open={notes.length === 0}>
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
