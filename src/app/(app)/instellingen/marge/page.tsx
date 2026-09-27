import type { Metadata } from "next";
import { PageHeader, cardClass, pageClass } from "@/components/page";
import { requireManager } from "@/lib/auth/session";
import { formatPercentageInput } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { MarginForm } from "./margin-form";

export const metadata: Metadata = { title: "Marge op materiaal · Schrijnwerk" };

export default async function MarginPage() {
  await requireManager();
  const supabase = await createClient();
  const { data: settings, error } = await supabase
    .from("settings")
    .select("material_margin_bp")
    .single();
  if (error) {
    throw new Error(`Could not load settings: ${error.message}`);
  }

  return (
    <main className={pageClass}>
      <PageHeader
        title="Marge op materiaal"
        back={{ href: "/account", label: "Meer" }}
        description="Geldt voor alle materiaal, tenzij een job of een materiaal een eigen marge heeft (job gaat voor materiaal)."
      />
      <div className={`${cardClass} md:max-w-2xl`}>
        <MarginForm margin={formatPercentageInput(settings.material_margin_bp)} />
      </div>
    </main>
  );
}
