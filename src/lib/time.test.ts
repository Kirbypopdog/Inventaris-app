import { describe, expect, it } from "vitest";
import {
  brusselsLocalToUtcIso,
  formatDuration,
  minutesBetween,
  toBrusselsDate,
  toBrusselsTime,
} from "./time";

describe("brusselsLocalToUtcIso", () => {
  it("uses winter time (UTC+1) and summer time (UTC+2)", () => {
    expect(brusselsLocalToUtcIso("2026-01-15", "08:00")).toBe("2026-01-15T07:00:00.000Z");
    expect(brusselsLocalToUtcIso("2026-07-15", "08:00")).toBe("2026-07-15T06:00:00.000Z");
  });

  it("handles the days the clock changes", () => {
    // Summer time starts on 29 March 2026 at 02:00 -> 03:00.
    expect(brusselsLocalToUtcIso("2026-03-29", "01:30")).toBe("2026-03-29T00:30:00.000Z");
    expect(brusselsLocalToUtcIso("2026-03-29", "02:30")).toBeNull();
    expect(brusselsLocalToUtcIso("2026-03-29", "08:00")).toBe("2026-03-29T06:00:00.000Z");
    // Winter time starts on 25 October 2026 at 03:00 -> 02:00.
    expect(brusselsLocalToUtcIso("2026-10-25", "08:00")).toBe("2026-10-25T07:00:00.000Z");
  });

  it("rejects invalid input", () => {
    expect(brusselsLocalToUtcIso("2026-1-15", "08:00")).toBeNull();
    expect(brusselsLocalToUtcIso("2026-01-15", "24:00")).toBeNull();
    expect(brusselsLocalToUtcIso("2026-01-15", "8:00")).toBeNull();
    expect(brusselsLocalToUtcIso("2026-02-30", "08:00")).toBeNull();
  });
});

describe("toBrusselsDate / toBrusselsTime", () => {
  it("shows Belgian date and time", () => {
    expect(toBrusselsDate("2026-07-15T22:30:00Z")).toBe("2026-07-16");
    expect(toBrusselsTime("2026-07-15T22:30:00Z")).toBe("00:30");
    expect(toBrusselsTime("2026-01-15T07:05:00Z")).toBe("08:05");
  });

  it("round-trips with brusselsLocalToUtcIso", () => {
    const iso = brusselsLocalToUtcIso("2026-10-01", "16:45");
    expect(iso).not.toBeNull();
    if (iso) {
      expect(toBrusselsDate(iso)).toBe("2026-10-01");
      expect(toBrusselsTime(iso)).toBe("16:45");
    }
  });
});

describe("minutesBetween / formatDuration", () => {
  it("counts whole minutes", () => {
    expect(minutesBetween("2026-10-01T06:00:00Z", "2026-10-01T08:05:29Z")).toBe(125);
    expect(minutesBetween("2026-10-01T06:00:00Z", "2026-10-01T06:00:31Z")).toBe(1);
    expect(minutesBetween("2026-10-01T08:00:00Z", "2026-10-01T06:00:00Z")).toBe(0);
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(125)).toBe("2u 05m");
    expect(formatDuration(45)).toBe("45m");
    expect(formatDuration(0)).toBe("0m");
  });
});
