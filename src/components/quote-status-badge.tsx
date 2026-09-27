import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@/lib/labels";

const STATUS_CLASSES: Record<QuoteStatus, string> = {
  draft: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200",
  sent: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  accepted: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_CLASSES[status]}`}>
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}
