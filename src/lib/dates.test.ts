import { describe, expect, it } from "vitest";
import { formatDate, formatPeriod } from "./dates";

describe("formatDate", () => {
  it("formats in Belgian Dutch, independent of the time zone", () => {
    expect(formatDate("2026-10-01")).toMatch(/^1 okt\.? 2026$/);
    expect(formatDate("2026-12-31")).toMatch(/^31 dec\.? 2026$/);
  });
});

describe("formatPeriod", () => {
  it("shows a range as short as possible", () => {
    expect(formatPeriod("2026-10-01", "2026-10-05")).toMatch(/^1–5 okt\.? 2026$/);
    expect(formatPeriod("2026-09-28", "2026-10-03")).toMatch(/^28 sep\.? – 3 okt\.? 2026$/);
    expect(formatPeriod("2026-12-29", "2027-01-02")).toMatch(/^29 dec\.? 2026 – 2 jan\.? 2027$/);
  });

  it("shows a single date or nothing", () => {
    expect(formatPeriod("2026-10-01", "2026-10-01")).toMatch(/^1 okt\.? 2026$/);
    expect(formatPeriod(null, "2026-10-05")).toMatch(/^5 okt\.? 2026$/);
    expect(formatPeriod(null, null)).toBeNull();
  });
});
