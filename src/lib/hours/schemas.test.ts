import { describe, expect, it } from "vitest";
import { timeEntrySchema } from "./schemas";

const valid = {
  jobId: "11111111-1111-4111-8111-111111111111",
  date: "2026-10-01",
  from: "07:30",
  until: "16:00",
  note: "",
};

describe("timeEntrySchema", () => {
  it("converts Belgian times to UTC timestamps", () => {
    expect(timeEntrySchema.parse(valid)).toEqual({
      jobId: valid.jobId,
      startedAt: "2026-10-01T05:30:00.000Z",
      endedAt: "2026-10-01T14:00:00.000Z",
      note: null,
    });
  });

  it.each([
    [{ until: "07:30" }, "Het einduur moet na het beginuur liggen."],
    [{ until: "06:00" }, "Het einduur moet na het beginuur liggen."],
    [{ date: "" }, "Geef een datum in."],
    [{ from: "" }, "Geef een beginuur in."],
    [{ date: "2026-03-29", from: "02:15" }, "Dit tijdstip bestaat niet."],
  ])("rejects %o", (override, message) => {
    const result = timeEntrySchema.safeParse({ ...valid, ...override });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});
