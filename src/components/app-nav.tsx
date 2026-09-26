"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Start", matches: (path: string) => path === "/" },
  { href: "/jobs", label: "Jobs", matches: (path: string) => path.startsWith("/jobs") },
  { href: "/klanten", label: "Klanten", matches: (path: string) => path.startsWith("/klanten") },
  {
    href: "/materiaal",
    label: "Materiaal",
    matches: (path: string) => path.startsWith("/materiaal"),
  },
  {
    href: "/account",
    label: "Account",
    matches: (path: string) =>
      ["/account", "/gebruikers", "/instellingen"].some((prefix) => path.startsWith(prefix)),
  },
] as const;

/** Bottom bar on a phone, sidebar on a laptop. */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] md:static md:w-56 md:shrink-0 md:border-t-0 md:border-r md:pb-0 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="hidden px-6 pt-6 pb-4 text-xl font-semibold md:block">Schrijnwerk</p>
      <ul className="grid grid-cols-5 md:flex md:flex-col md:gap-1 md:px-3">
        {ITEMS.map((item) => {
          const active = item.matches(pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 items-center justify-center text-sm font-medium sm:text-base md:min-h-12 md:justify-start md:rounded-xl md:px-3 ${
                  active
                    ? "text-zinc-900 underline decoration-2 underline-offset-8 md:bg-zinc-100 md:no-underline dark:text-zinc-50 dark:md:bg-zinc-800"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
