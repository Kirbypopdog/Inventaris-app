import type { Metadata } from "next";
import { PageHeader, pageClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { EXPORT_DATASETS } from "@/lib/export/datasets";

export const metadata: Metadata = { title: "Gegevens exporteren · Schrijnwerk" };

export default async function ExportPage() {
  await requireMember();

  return (
    <main className={pageClass}>
      <PageHeader
        title="Gegevens exporteren"
        back={{ href: "/account", label: "Meer" }}
        description="Download je gegevens als bestand voor Excel (csv). Bedragen zijn in euro."
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {Object.entries(EXPORT_DATASETS).map(([key, dataset]) => (
          <li key={key}>
            {/* A plain link: the browser downloads the file, no client code needed. */}
            <a
              href={`/export/${key}`}
              download
              className="flex min-h-16 flex-col gap-1 rounded-2xl border border-stone-200 bg-white p-4 hover:border-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:border-stone-600"
            >
              <span className="text-lg font-semibold">{dataset.label}</span>
              <span className="text-base text-stone-600 dark:text-stone-400">
                {dataset.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
