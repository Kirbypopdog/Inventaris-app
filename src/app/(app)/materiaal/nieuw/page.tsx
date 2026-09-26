import type { Metadata } from "next";
import { PageHeader, cardClass, pageClass } from "@/components/page";
import { requireMember } from "@/lib/auth/session";
import { MaterialForm, emptyMaterial } from "../material-form";

export const metadata: Metadata = { title: "Nieuw materiaal · Schrijnwerk" };

export default async function NewMaterialPage() {
  await requireMember();
  return (
    <main className={pageClass}>
      <PageHeader title="Nieuw materiaal" back={{ href: "/materiaal", label: "Materiaal" }} />
      <div className={`${cardClass} md:max-w-2xl`}>
        <MaterialForm material={emptyMaterial} />
      </div>
    </main>
  );
}
