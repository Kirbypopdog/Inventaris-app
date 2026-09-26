import { z } from "zod";
import { optionalText } from "@/lib/forms";
import { brusselsLocalToUtcIso } from "@/lib/time";

export const TIME_ENTRY_FIELDS = ["jobId", "date", "from", "until", "note"] as const;

/** A manually entered or corrected time entry, in Belgian time. */
export const timeEntrySchema = z
  .object({
    jobId: z.uuid({ error: "Onbekende job." }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Geef een datum in." }),
    from: z.string().regex(/^\d{2}:\d{2}$/, { error: "Geef een beginuur in." }),
    until: z.string().regex(/^\d{2}:\d{2}$/, { error: "Geef een einduur in." }),
    note: optionalText(500, "De notitie is te lang (maximaal 500 tekens)."),
  })
  .transform((value, context) => {
    const startedAt = brusselsLocalToUtcIso(value.date, value.from);
    const endedAt = brusselsLocalToUtcIso(value.date, value.until);
    if (!startedAt || !endedAt) {
      context.addIssue({ code: "custom", message: "Dit tijdstip bestaat niet.", path: ["from"] });
      return z.NEVER;
    }
    if (endedAt <= startedAt) {
      context.addIssue({
        code: "custom",
        message: "Het einduur moet na het beginuur liggen.",
        path: ["until"],
      });
      return z.NEVER;
    }
    return { jobId: value.jobId, startedAt, endedAt, note: value.note };
  });

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
