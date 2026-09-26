import type { Metadata } from "next";
import Link from "next/link";
import { secondaryButtonClass } from "@/components/form";
import { PageHeader, pageClass, secondaryLinkButtonClass } from "@/components/page";
import { signOut } from "@/lib/auth/actions";
import { ROLE_LABELS, isManagerRole } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Account · Schrijnwerk" };

export default async function AccountPage() {
  const session = await requireSession();
  const member = session.status === "member" ? session.member : null;

  return (
    <main className={pageClass}>
      <PageHeader
        title="Account"
        description={
          member
            ? `${member.displayName} · ${member.email} · ${ROLE_LABELS[member.role]}`
            : session.status === "no-access"
              ? session.email
              : undefined
        }
      />
      <div className="flex flex-col gap-3 md:max-w-sm">
        {member && (
          <Link href="/wachtwoord" className={secondaryLinkButtonClass}>
            Wachtwoord wijzigen
          </Link>
        )}
        {member && isManagerRole(member.role) && (
          <>
            <Link href="/gebruikers" className={secondaryLinkButtonClass}>
              Gebruikers beheren
            </Link>
            <Link href="/instellingen/uurtarieven" className={secondaryLinkButtonClass}>
              Uurtarieven
            </Link>
          </>
        )}
        <form action={signOut}>
          <button type="submit" className={secondaryButtonClass}>
            Afmelden
          </button>
        </form>
      </div>
    </main>
  );
}
