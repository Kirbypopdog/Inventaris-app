import { describe, expect, it } from "vitest";
import type { JobStatus } from "./labels";
import { groupProjects } from "./projects";

const job = (id: string, status: JobStatus, startsOn: string | null = null) => ({
  id,
  title: id,
  status,
  startsOn,
  endsOn: null,
});

describe("groupProjects", () => {
  const customers = [
    { id: "c1", name: "Vandamme", jobs: [job("stairs", "planned", "2026-10-12")] },
    { id: "c2", name: "Maes", jobs: [job("kitchen", "active"), job("bath", "done")] },
    { id: "c3", name: "Peeters", jobs: [job("doors", "planned", "2026-10-01")] },
    { id: "c4", name: "Claeys", jobs: [job("old", "done"), job("gone", "cancelled")] },
    { id: "c5", name: "Aerts", jobs: [job("someday", "planned")] },
    { id: "c6", name: "Bauwens", jobs: [] },
  ];

  it("puts customers in progress, planned and the rest in their own section", () => {
    const groups = groupProjects(customers);
    expect(groups.active.map((card) => card.customer.name)).toEqual(["Maes"]);
    // Planned: the earliest start first, unplanned jobs last.
    expect(groups.planned.map((card) => card.customer.name)).toEqual([
      "Peeters",
      "Vandamme",
      "Aerts",
    ]);
    expect(groups.others.map((card) => card.customer.name)).toEqual(["Bauwens", "Claeys"]);
  });

  it("shows the open jobs and counts the closed ones", () => {
    const maes = groupProjects(customers).active[0];
    expect(maes?.shownJobs.map((shown) => shown.id)).toEqual(["kitchen"]);
    expect(maes?.closedCount).toBe(1);
    const claeys = groupProjects(customers).others.find((card) => card.customer.id === "c4");
    expect(claeys?.shownJobs).toEqual([]);
    expect(claeys?.closedCount).toBe(2);
  });

  it("also shows closed jobs found by a search", () => {
    const groups = groupProjects(customers, new Set(["old"]));
    const claeys = groups.others.find((card) => card.customer.id === "c4");
    expect(claeys?.shownJobs.map((shown) => shown.id)).toEqual(["old"]);
  });

  it("orders jobs: in progress, then by start date, unplanned last", () => {
    const [card] = groupProjects([
      {
        id: "c",
        name: "Mix",
        jobs: [
          job("later", "planned", "2026-11-01"),
          job("unplanned", "planned"),
          job("now", "active", "2026-12-01"),
          job("soon", "planned", "2026-10-01"),
        ],
      },
    ]).active;
    expect(card?.shownJobs.map((shown) => shown.id)).toEqual(["now", "soon", "later", "unplanned"]);
  });
});
