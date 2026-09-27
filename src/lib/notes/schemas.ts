import { z } from "zod";

export const NOTE_MAX_LENGTH = 2000;
export const TASK_MAX_LENGTH = 200;

export const NOTE_FIELDS = ["jobId", "body"] as const;

/** A note about a job: free text, like the database allows (1 to 2000 characters). */
export const noteSchema = z.object({
  jobId: z.uuid({ error: "Onbekende job." }),
  body: z
    .string()
    .trim()
    .min(1, { error: "Schrijf eerst iets in de notitie." })
    .max(NOTE_MAX_LENGTH, { error: "De notitie is te lang (maximaal 2000 tekens)." }),
});

export const NOTE_UPDATE_FIELDS = ["body"] as const;

export const noteUpdateSchema = noteSchema.pick({ body: true });

export const TASK_FIELDS = ["jobId", "title"] as const;

/** A task on a job: one short line of what still has to happen. */
export const taskSchema = z.object({
  jobId: z.uuid({ error: "Onbekende job." }),
  title: z
    .string()
    .trim()
    .min(1, { error: "Schrijf eerst wat er moet gebeuren." })
    .max(TASK_MAX_LENGTH, { error: "De taak is te lang (maximaal 200 tekens)." }),
});

/** Ticking a task off, or opening it again. */
export const taskDoneSchema = z.object({
  id: z.uuid(),
  done: z.boolean(),
});
