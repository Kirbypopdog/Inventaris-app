import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { secondaryButtonClass } from "@/components/form";
import {
  AnalysesIcon,
  ChevronRightIcon,
  ExportIcon,
  KeyIcon,
  MaterialsIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "@/components/icons";
import { PageHeader, pageClass } from "@/components/page";
import { signOut } from "@/lib/auth/actions";
import { ROLE_LABELS, isManagerRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Meer · Schrijnwerk" };

type MenuLink = { href: string; label: string; icon: ReactNode };

function MenuSection({ title, links }: { title: string; links: MenuLink[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-semibold tracking-wide text-stone-500 uppercase">{title}</h2>
      <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-950">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-14 items-center gap-3 px-4 text-lg hover:bg-stone-50 dark:hover:bg-stone-900"
            >
              <span className="text-brand-700 dark:text-brand-300">{link.icon}</span>
              <span className="flex-1">{link.label}</span>
              <ChevronRightIcon className="size-5 shrink-0 text-stone-400" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Meer": everything that is not in the phone's bottom bar, plus settings and the account. */
export default async function MorePage() {
  const session = await requireSession();
  const member = session.status === "member" ? session.member : null;

  return (
    <main className={pageClass}>
      <PageHeader
        title="Meer"
        description={
          member
            ? `${member.displayName} · ${member.email} · ${ROLE_LABELS[member.role]}`
            : session.status === "no-access"
              ? session.email
              : undefined
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        {member && (
          <MenuSection
            title="Werk"
            links={[
              { href: "/materiaal", label: "Materiaal", icon: <MaterialsIcon /> },
              { href: "/analyses", label: "Analyses", icon: <AnalysesIcon /> },
              { href: "/zoeken", label: "Zoeken", icon: <SearchIcon /> },
              { href: "/export", label: "Gegevens exporteren", icon: <ExportIcon /> },
            ]}
          />
        )}
        {member && isManagerRole(member.role) && (
          <MenuSection
            title="Instellingen"
            links={[
              { href: "/instellingen/bedrijf", label: "Bedrijfsgegevens", icon: <SettingsIcon /> },
              { href: "/instellingen/uurtarieven", label: "Uurtarieven", icon: <SettingsIcon /> },
              {
                href: "/instellingen/verplaatsingen",
                label: "Verplaatsingen",
                icon: <SettingsIcon />,
              },
              { href: "/instellingen/marge", label: "Marge op materiaal", icon: <SettingsIcon /> },
              { href: "/gebruikers", label: "Gebruikers beheren", icon: <UsersIcon /> },
            ]}
          />
        )}
        <section className="flex flex-col gap-3">
          {member && (
            <MenuSection
              title="Account"
              links={[{ href: "/wachtwoord", label: "Wachtwoord wijzigen", icon: <KeyIcon /> }]}
            />
          )}
          <form action={signOut}>
            <button type="submit" className={secondaryButtonClass}>
              Afmelden
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
