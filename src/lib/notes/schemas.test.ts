import { describe, expect, it } from "vitest";
import { noteSchema, noteUpdateSchema, taskDoneSchema, taskSchema } from "./schemas";

const jobId = "bbbbbbbb-0000-4000-8000-000000000001";

describe("noteSchema", () => {
  it("trims the text", () => {
    expect(noteSchema.parse({ jobId, body: "  Deur links draaiend \n" })).toEqual({
      jobId,
      body: "Deur links draaiend",
    });
  });

  it("refuses an empty note", () => {
    const result = noteSchema.safeParse({ jobId, body: "   " });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Schrijf eerst iets in de notitie.");
  });

  it("refuses a note longer than the database allows", () => {
    expect(noteSchema.safeParse({ jobId, body: "x".repeat(2001) }).success).toBe(false);
    expect(noteSchema.safeParse({ jobId, body: "x".repeat(2000) }).success).toBe(true);
  });

  it("refuses an unknown job", () => {
    expect(noteSchema.safeParse({ jobId: "keuken", body: "x" }).success).toBe(false);
  });

  it("only needs the text to correct a note", () => {
    expect(noteUpdateSchema.parse({ body: " Nieuw " })).toEqual({ body: "Nieuw" });
  });
});

describe("taskSchema", () => {
  it("trims the title", () => {
    expect(taskSchema.parse({ jobId, title: " Plinten bestellen " })).toEqual({
      jobId,
      title: "Plinten bestellen",
    });
  });

  it("refuses an empty or too long task", () => {
    expect(taskSchema.safeParse({ jobId, title: "" }).success).toBe(false);
    expect(taskSchema.safeParse({ jobId, title: "x".repeat(201) }).success).toBe(false);
  });
});

describe("taskDoneSchema", () => {
  it("needs a task id and a yes or no", () => {
    expect(taskDoneSchema.safeParse({ id: jobId, done: true }).success).toBe(true);
    expect(taskDoneSchema.safeParse({ id: jobId, done: "ja" }).success).toBe(false);
    expect(taskDoneSchema.safeParse({ id: "x", done: false }).success).toBe(false);
  });
});
