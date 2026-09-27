"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  AgendaIcon,
  AnalysesIcon,
  HomeIcon,
  JobsIcon,
  MaterialsIcon,
  MoreIcon,
  QuotesIcon,
  SearchIcon,
} from "@/components/icons";

type NavItem = { href: string; label: string; icon: ReactNode; prefixes: string[] };

const START: NavItem = { href: "/", label: "Start", icon: <HomeIcon />, prefixes: [] };
const PROJECTS: NavItem = {
  href: "/klanten",
  label: "Projecten",
  icon: <JobsIcon />,
  prefixes: ["/klanten", "/jobs"],
};
const AGENDA: NavItem = {
  href: "/agenda",
  label: "Agenda",
  icon: <AgendaIcon />,
  prefixes: ["/agenda"],
};
const QUOTES: NavItem = {
  href: "/offertes",
  label: "Offertes",
  icon: <QuotesIcon />,
  prefixes: ["/offertes"],
};
/** Everything that is not in the phone's bottom bar is reached via "Meer" there. */
const SECONDARY: NavItem[] = [
  { href: "/materiaal", label: "Materiaal", icon: <MaterialsIcon />, prefixes: ["/materiaal"] },
  { href: "/analyses", label: "Analyses", icon: <AnalysesIcon />, prefixes: ["/analyses"] },
  { href: "/zoeken", label: "Zoeken", icon: <SearchIcon />, prefixes: ["/zoeken"] },
];
const ACCOUNT_PREFIXES = ["/account", "/gebruikers", "/instellingen", "/export"];

const PHONE_ITEMS: NavItem[] = [
  START,
  PROJECTS,
  AGENDA,
  QUOTES,
  {
    href: "/account",
    label: "Meer",
    icon: <MoreIcon />,
    prefixes: [...ACCOUNT_PREFIXES, ...SECONDARY.flatMap((item) => item.prefixes)],
  },
];

const LAPTOP_ITEMS: NavItem[] = [
  START,
  PROJECTS,
  AGENDA,
  QUOTES,
  ...SECONDARY,
  { href: "/account", label: "Meer", icon: <MoreIcon />, prefixes: ACCOUNT_PREFIXES },
];

function isActive(item: NavItem, pathname: string): boolean {
  return item.href === "/"
    ? pathname === "/"
    : item.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * Bottom bar with the five daily items on a phone, full sidebar on a laptop.
 * Only one of the two lists is displayed, so the other is hidden from screen readers too.
 */
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-t-0 md:border-r md:bg-white md:pb-0 dark:border-stone-800 dark:bg-stone-950/95 dark:md:bg-stone-950"
    >
      <p className="hidden items-center gap-2 px-6 pt-6 pb-5 text-xl font-semibold md:flex">
        <span aria-hidden="true" className="bg-brand-600 dark:bg-brand-400 size-3 rounded-sm" />
        Schrijnwerk
      </p>
      <ul className="grid grid-cols-5 md:hidden">
        {PHONE_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active
                    ? "text-brand-700 dark:text-brand-300"
                    : "text-stone-500 dark:text-stone-400"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full ${
                    active ? "bg-brand-100 dark:bg-brand-900" : ""
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="hidden flex-col gap-1 px-3 md:flex">
        {LAPTOP_ITEMS.map((item) => {
          const active = isActive(item, pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium ${
                  active
                    ? "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-900"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
