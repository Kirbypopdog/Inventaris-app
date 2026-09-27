/** The app's mark: a carpenter's square on the wood colour. Decorative; the name is text next to it. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`bg-brand-700 dark:bg-brand-400 dark:text-brand-950 flex shrink-0 items-center justify-center rounded-lg text-white ${
        className ?? "size-7"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-3/5" fill="currentColor">
        <path d="M4 3h5v12h12v5H4z" />
        <path
          d="M6.5 5.5v2M6.5 9.5v2M10.5 17.5h2M14.5 17.5h2"
          stroke="var(--color-brand-700)"
          strokeWidth="1.2"
        />
      </svg>
    </span>
  );
}
