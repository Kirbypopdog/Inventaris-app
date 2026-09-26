import { inputClass } from "@/components/form";

/** Plain GET form: the search term ends up in the URL, so results can be bookmarked. */
export function SearchForm({
  label,
  defaultValue,
  hidden,
}: {
  label: string;
  defaultValue: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form role="search" className="flex gap-3">
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <input
        type="search"
        name="q"
        aria-label={label}
        placeholder={label}
        defaultValue={defaultValue}
        className={inputClass}
      />
      <button
        type="submit"
        className="min-h-14 shrink-0 rounded-xl border border-zinc-300 px-5 text-lg font-medium dark:border-zinc-700"
      >
        Zoek
      </button>
    </form>
  );
}
