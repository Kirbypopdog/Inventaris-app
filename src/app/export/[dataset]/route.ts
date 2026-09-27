import { requireMember } from "@/lib/auth/session";
import { toCsv } from "@/lib/export/csv";
import { EXPORT_DATASETS, isExportDatasetKey } from "@/lib/export/datasets";
import { createClient } from "@/lib/supabase/server";
import { toBrusselsDate } from "@/lib/time";

/** Downloads one dataset as a CSV file for Excel. Members only; RLS applies. */
export async function GET(_request: Request, context: RouteContext<"/export/[dataset]">) {
  await requireMember();
  const { dataset } = await context.params;
  if (!isExportDatasetKey(dataset)) {
    return new Response("Onbekende export.", { status: 404 });
  }

  const supabase = await createClient();
  const table = await EXPORT_DATASETS[dataset].load(supabase);
  const today = toBrusselsDate(new Date().toISOString());
  return new Response(toCsv(table.headers, table.rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="schrijnwerk-${dataset}-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
