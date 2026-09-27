import { OPEN_JOB_STATUSES, type JobStatus } from "@/lib/labels";

export type ProjectJob = {
  id: string;
  title: string;
  status: JobStatus;
  startsOn: string | null;
  endsOn: string | null;
};

export type ProjectCustomer<J extends ProjectJob = ProjectJob> = {
  id: string;
  name: string;
  jobs: J[];
};

export type ProjectCard<C extends ProjectCustomer> = {
  customer: C;
  /** Jobs to show on the card: the open ones, plus those that match a search. */
  shownJobs: C["jobs"];
  /** Finished or cancelled jobs that are not shown. */
  closedCount: number;
};

export type ProjectGroups<C extends ProjectCustomer> = {
  /** At least one job in progress. */
  active: ProjectCard<C>[];
  /** No job in progress, at least one planned. */
  planned: ProjectCard<C>[];
  /** No open jobs. */
  others: ProjectCard<C>[];
};

const isOpen = (job: ProjectJob) => OPEN_JOB_STATUSES.includes(job.status);

/** Jobs in progress first, then by start date (unplanned last), then by title. */
function compareJobs(a: ProjectJob, b: ProjectJob): number {
  if (a.status !== b.status && (a.status === "active" || b.status === "active")) {
    return a.status === "active" ? -1 : 1;
  }
  if (a.startsOn !== b.startsOn) {
    if (a.startsOn === null) return 1;
    if (b.startsOn === null) return -1;
    return a.startsOn < b.startsOn ? -1 : 1;
  }
  return a.title.localeCompare(b.title, "nl");
}

/** The earliest start of the shown open jobs, to put the first planned customer on top. */
function firstStart(card: ProjectCard<ProjectCustomer>): string | null {
  return (
    card.shownJobs
      .filter(isOpen)
      .map((job) => job.startsOn)
      .filter((start): start is string => start !== null)
      .sort()[0] ?? null
  );
}

/**
 * Sorts customers into the sections of the projects page. `matchedJobIds` are jobs found by a
 * search: they are shown on the card even when they are finished.
 */
export function groupProjects<C extends ProjectCustomer>(
  customers: readonly C[],
  matchedJobIds: ReadonlySet<string> = new Set(),
): ProjectGroups<C> {
  const groups: ProjectGroups<C> = { active: [], planned: [], others: [] };
  for (const customer of customers) {
    const shownJobs = customer.jobs
      .filter((job) => isOpen(job) || matchedJobIds.has(job.id))
      .sort(compareJobs);
    const card: ProjectCard<C> = {
      customer,
      shownJobs,
      closedCount: customer.jobs.length - customer.jobs.filter(isOpen).length,
    };
    if (customer.jobs.some((job) => job.status === "active")) {
      groups.active.push(card);
    } else if (customer.jobs.some((job) => job.status === "planned")) {
      groups.planned.push(card);
    } else {
      groups.others.push(card);
    }
  }
  const byName = (a: ProjectCard<C>, b: ProjectCard<C>) =>
    a.customer.name.localeCompare(b.customer.name, "nl");
  groups.active.sort(byName);
  groups.planned.sort((a, b) => {
    const startA = firstStart(a);
    const startB = firstStart(b);
    if (startA !== startB) {
      if (startA === null) return 1;
      if (startB === null) return -1;
      return startA < startB ? -1 : 1;
    }
    return byName(a, b);
  });
  groups.others.sort(byName);
  return groups;
}
