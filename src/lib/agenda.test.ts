import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  barSpan,
  dayOfMonth,
  formatMonth,
  formatWeekdayShort,
  isMonthValue,
  isWeekend,
  layoutBars,
  monthOf,
  monthWeeks,
  formatDay,
  isDateValue,
  isoWeekNumber,
  weekDays,
  weekStart,
} from "./agenda";

describe("weekStart", () => {
  it.each([
    ["2026-09-27", "2026-09-21"], // Sunday
    ["2026-09-28", "2026-09-28"], // Monday
    ["2026-10-01", "2026-09-28"], // Thursday
    ["2027-01-01", "2026-12-28"], // across the year
  ])("%s is in the week of %s", (day, monday) => {
    expect(weekStart(day)).toBe(monday);
  });
});

describe("weekDays / addDays", () => {
  it("gives Monday to Sunday", () => {
    expect(weekDays("2026-09-28")).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
  });

  it("is not shifted by daylight saving time", () => {
    // Summer time ends on 25 October 2026 in Belgium.
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-10-26", -7)).toBe("2026-10-19");
  });
});

describe("isoWeekNumber", () => {
  it.each([
    ["2026-09-28", 40],
    ["2026-01-01", 1],
    ["2027-01-01", 53],
    ["2027-01-04", 1],
  ])("%s is in week %i", (day, week) => {
    expect(isoWeekNumber(day)).toBe(week);
  });
});

describe("isDateValue / formatDay", () => {
  it("accepts only real dates", () => {
    expect(isDateValue("2026-09-28")).toBe(true);
    expect(isDateValue("2026-02-30")).toBe(false);
    expect(isDateValue("28/09/2026")).toBe(false);
  });

  it("formats a day in Dutch", () => {
    expect(formatDay("2026-09-28")).toBe("maandag 28 september");
  });
});

describe("barSpan", () => {
  const week = weekDays("2026-09-21");

  it("places a job within the week", () => {
    expect(barSpan({ startsOn: "2026-09-22", endsOn: "2026-09-24" }, week)).toEqual({
      start: 1,
      end: 3,
      continuesBefore: false,
      continuesAfter: false,
    });
  });

  it("cuts a job that runs over the edges of the week", () => {
    expect(barSpan({ startsOn: "2026-09-17", endsOn: "2026-10-02" }, week)).toEqual({
      start: 0,
      end: 6,
      continuesBefore: true,
      continuesAfter: true,
    });
  });

  it("treats a job without an end as one day", () => {
    expect(barSpan({ startsOn: "2026-09-27", endsOn: null }, week)).toEqual({
      start: 6,
      end: 6,
      continuesBefore: false,
      continuesAfter: false,
    });
  });

  it("gives nothing for a job outside the week or without a start", () => {
    expect(barSpan({ startsOn: "2026-09-28", endsOn: "2026-09-30" }, week)).toBeNull();
    expect(barSpan({ startsOn: "2026-09-10", endsOn: "2026-09-20" }, week)).toBeNull();
    expect(barSpan({ startsOn: null, endsOn: "2026-09-22" }, week)).toBeNull();
  });
});

describe("layoutBars", () => {
  const week = weekDays("2026-09-21");
  const job = (id: string, startsOn: string, endsOn: string) => ({ id, startsOn, endsOn });

  it("stacks overlapping jobs and reuses a lane once it is free", () => {
    const bars = layoutBars(
      [
        job("short", "2026-09-21", "2026-09-22"),
        job("long", "2026-09-21", "2026-09-25"),
        job("later", "2026-09-24", "2026-09-26"),
        job("next-week", "2026-09-28", "2026-09-29"),
      ],
      week,
    );
    expect(bars.map((bar) => [bar.item.id, bar.lane])).toEqual([
      ["long", 0],
      ["short", 1],
      ["later", 1],
    ]);
  });
});

describe("months", () => {
  it("validates a month from the URL", () => {
    expect(isMonthValue("2026-09")).toBe(true);
    expect(isMonthValue("2026-13")).toBe(false);
    expect(isMonthValue("2026-9")).toBe(false);
  });

  it("moves across years", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(monthOf("2026-09-27")).toBe("2026-09");
  });

  it("gives the weeks that show a month", () => {
    // September 2026 runs from a Tuesday to a Wednesday.
    expect(monthWeeks("2026-09")).toEqual([
      "2026-08-31",
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
      "2026-09-28",
    ]);
    // February 2027 starts on a Monday and ends on a Sunday.
    expect(monthWeeks("2027-02")).toHaveLength(4);
  });

  it("formats in Belgian Dutch", () => {
    expect(formatMonth("2026-09")).toBe("september 2026");
    expect(formatWeekdayShort("2026-09-21")).toBe("ma");
    expect(dayOfMonth("2026-09-07")).toBe(7);
    expect(isWeekend("2026-09-26")).toBe(true);
    expect(isWeekend("2026-09-25")).toBe(false);
  });
});
