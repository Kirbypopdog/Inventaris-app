"use client";

import { useActionState } from "react";
import { addNote, addTask, updateNote } from "../notes-actions";
import {
  FormMessage,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/form";
import { idleFormState } from "@/lib/forms";
import { NOTE_MAX_LENGTH, TASK_MAX_LENGTH } from "@/lib/notes/schemas";

/** One line to add a task: type, tap Toevoegen, and the field is empty again for the next. */
export function TaskAddForm({ jobId }: { jobId: string }) {
  const [state, formAction, pending] = useActionState(addTask, idleFormState);
  const title = state.status === "error" ? (state.values?.title ?? "") : "";

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Nieuwe taak</span>
          <input
            name="title"
            required
            maxLength={TASK_MAX_LENGTH}
            defaultValue={title}
            placeholder="bv. plinten bestellen"
            autoComplete="off"
            className={inputClass}
          />
        </label>
        <div className="shrink-0">
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Bezig…" : "Toevoegen"}
          </button>
        </div>
      </div>
      {state.status === "error" && <FormMessage status="error" message={state.message} />}
    </form>
  );
}

export type NoteFormValues = { id?: string; jobId: string; body: string };

/** Write a new note (no id) or correct one (with id). */
export function NoteForm({ note }: { note: NoteFormValues }) {
  const [state, formAction, pending] = useActionState(
    note.id ? updateNote : addNote,
    idleFormState,
  );
  const body = state.status === "error" ? (state.values?.body ?? note.body) : note.body;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {note.id && <input type="hidden" name="id" value={note.id} />}
      <input type="hidden" name="jobId" value={note.jobId} />
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium">{note.id ? "Notitie" : "Nieuwe notitie"}</span>
        <textarea
          name="body"
          required
          rows={4}
          maxLength={NOTE_MAX_LENGTH}
          defaultValue={body}
          placeholder={note.id ? undefined : "bv. Klant wil de deur links draaiend"}
          className={inputClass}
        />
      </label>
      {state.status !== "idle" && <FormMessage status={state.status} message={state.message} />}
      <button
        type="submit"
        disabled={pending}
        className={note.id ? secondaryButtonClass : primaryButtonClass}
      >
        {pending ? "Bezig met opslaan…" : note.id ? "Aanpassing opslaan" : "Notitie bewaren"}
      </button>
    </form>
  );
}
