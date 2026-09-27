"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { toggleSidebar } from "@/lib/sidebar-actions";
import type { ReactNode } from "react";
import {
  AgendaIcon,
  AnalysesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
 * Bottom bar with the five daily items on a phone, sidebar on a laptop, both in dark wood.
 * The sidebar folds to icons; the labels stay for screen readers and as a tooltip.
 * Only one of the two lists is displayed, so the other is hidden from screen readers too.
 */
export function AppNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Hoofdmenu"
      className={`bg-wood-900 fixed inset-x-0 bottom-0 z-10 border-t border-black/20 pb-[env(safe-area-inset-bottom)] text-stone-300 md:sticky md:top-0 md:flex md:h-dvh md:shrink-0 md:flex-col md:border-t-0 md:pb-4 ${
        collapsed ? "md:w-20" : "md:w-60"
      }`}
    >
      <p
        className={`hidden items-center gap-2.5 pt-6 pb-5 text-xl font-semibold text-white md:flex ${
          collapsed ? "justify-center px-0" : "px-6"
        }`}
      >
        <BrandMark />
        <span className={collapsed ? "sr-only" : undefined}>Schrijnwerk</span>
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
                  active ? "text-white" : "text-stone-400"
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full ${
                    active ? "bg-wood-700 text-brand-300" : ""
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
                title={collapsed ? item.label : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-xl text-base font-medium ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  active
                    ? "bg-brand-700 text-white"
                    : "hover:bg-wood-800 text-stone-300 hover:text-white"
                }`}
              >
                {item.icon}
                <span className={collapsed ? "sr-only" : undefined}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <form action={toggleSidebar} className="mt-auto hidden px-3 md:block">
        <button
          type="submit"
          title={collapsed ? "Menu uitklappen" : undefined}
          className={`hover:bg-wood-800 flex min-h-12 w-full items-center gap-3 rounded-xl text-base text-stone-400 hover:text-white ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          <span className={collapsed ? "sr-only" : undefined}>
            {collapsed ? "Menu uitklappen" : "Menu inklappen"}
          </span>
        </button>
      </form>
    </nav>
  );
}
