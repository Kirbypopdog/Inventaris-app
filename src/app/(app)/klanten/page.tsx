import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmptyState, PageHeader, linkButtonClass, pageClass } from "@/components/page";
import {
  NewCustomerCard,
  ProjectCard,
  type ProjectCustomerView,
  type ProjectSection,
} from "@/components/project-card";
import { SearchForm } from "@/components/search-form";
import { requireMember } from "@/lib/auth/session";
import { type ProjectCard as Card, groupProjects } from "@/lib/projects";
import { cleanSearchTerm, ilikeAnyFilter } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Projecten · Schrijnwerk" };

const CUSTOMER_SELECT =
  "id, name, type, city, jobs(id, title, status, starts_on, ends_on)" as const;

function Section({
  title,
  accent = false,
  children,
}: {
  title: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2
        className={`text-sm font-semibold tracking-wide uppercase ${
          accent ? "text-brand-700 dark:text-brand-300" : "text-stone-500"
        }`}
      >
        {title}
      </h2>
      <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{children}</ul>
    </section>
  );
}

function cards(list: Card<ProjectCustomerView>[], section: ProjectSection) {
  return list.map((card) => (
    <li key={card.customer.id}>
      <ProjectCard card={card} section={section} />
    </li>
  ));
}

/** "Projecten": a card per customer with its open jobs, grouped by what is going on. */
export default async function ProjectsPage({ searchParams }: PageProps<"/klanten">) {
  await requireMember();
  const params = await searchParams;
  const term = cleanSearchTerm(params.q);
  const showArchived = params.archief === "1";

  const supabase = await createClient();
  // A search also finds customers through the title, description or place of their jobs.
  const jobFilter = ilikeAnyFilter(["title", "description", "city"], term);
  const matchedJobs = jobFilter
    ? await supabase.from("jobs").select("id, customer_id").or(jobFilter)
    : { data: [], error: null };
  if (matchedJobs.error) {
    throw new Error(`Could not search jobs: ${matchedJobs.error.message}`);
  }

  let query = supabase.from("customers").select(CUSTOMER_SELECT).order("name");
  query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const customerFilter = ilikeAnyFilter(["name", "city", "email", "phone"], term);
  if (customerFilter) {
    const customerIds = [...new Set(matchedJobs.data.map((job) => job.customer_id))];
    query = query.or(
      customerIds.length > 0
        ? `${customerFilter},id.in.(${customerIds.join(",")})`
        : customerFilter,
    );
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Could not load projects: ${error.message}`);
  }

  const customers: ProjectCustomerView[] = data.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    city: row.city,
    jobs: row.jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      startsOn: job.starts_on,
      endsOn: job.ends_on,
    })),
  }));
  const groups = groupProjects(customers, new Set(matchedJobs.data.map((job) => job.id)));
  const found = customers.length > 0;

  return (
    <main className={pageClass}>
      <PageHeader
        title={showArchived ? "Gearchiveerde klanten" : "Projecten"}
        description={showArchived ? undefined : "Een kaart per klant, met zijn lopende jobs."}
        action={
          showArchived ? undefined : (
            <Link href="/jobs/nieuw" className={linkButtonClass}>
              Nieuwe job
            </Link>
          )
        }
      />
      <SearchForm
        label="Zoek op klant, job of gemeente"
        defaultValue={term}
        hidden={showArchived ? { archief: "1" } : undefined}
      />

      {term && !found && <EmptyState>{`Niets gevonden voor "${term}".`}</EmptyState>}
      {showArchived && !term && !found && <EmptyState>Geen gearchiveerde klanten.</EmptyState>}

      {groups.active.length > 0 && (
        <Section title="Lopend" accent>
          {cards(groups.active, "active")}
        </Section>
      )}
      {groups.planned.length > 0 && (
        <Section title="Gepland">{cards(groups.planned, "planned")}</Section>
      )}
      {(groups.others.length > 0 || (!term && !showArchived)) && (
        <Section title={showArchived ? "Zonder lopende jobs" : "Overige klanten"}>
          {!term && !showArchived && (
            <li>
              <NewCustomerCard />
            </li>
          )}
          {cards(groups.others, "others")}
        </Section>
      )}

      <Link
        href={showArchived ? "/klanten" : "/klanten?archief=1"}
        className="self-start py-2 text-base text-stone-600 underline dark:text-stone-400"
      >
        {showArchived ? "← Terug naar de projecten" : "Gearchiveerde klanten bekijken"}
      </Link>
    </main>
  );
}
