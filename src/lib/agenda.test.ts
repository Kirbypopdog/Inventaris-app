import { describe, expect, it } from "vitest";
import {
  addDays,
  coversDay,
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

describe("coversDay", () => {
  it("covers every day of the period", () => {
    const period = { startsOn: "2026-09-29", endsOn: "2026-10-01" };
    expect(coversDay(period, "2026-09-28")).toBe(false);
    expect(coversDay(period, "2026-09-29")).toBe(true);
    expect(coversDay(period, "2026-10-01")).toBe(true);
    expect(coversDay(period, "2026-10-02")).toBe(false);
  });

  it("treats a job without end date as one day, and without start date as unplanned", () => {
    expect(coversDay({ startsOn: "2026-09-29", endsOn: null }, "2026-09-29")).toBe(true);
    expect(coversDay({ startsOn: "2026-09-29", endsOn: null }, "2026-09-30")).toBe(false);
    expect(coversDay({ startsOn: null, endsOn: "2026-09-29" }, "2026-09-29")).toBe(false);
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
