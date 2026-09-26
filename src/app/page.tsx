import Link from "next/link";
import { secondaryButtonClass } from "@/components/form";
import { signOut } from "@/lib/auth/actions";
import { ROLE_LABELS, canManageMembers } from "@/lib/auth/roles";
import { requireSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await requireSession();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      {session.status === "member" ? (
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Dag {session.member.displayName}</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Je bent aangemeld als {ROLE_LABELS[session.member.role].toLowerCase()}. Klanten, jobs en
            de inklokknop komen hier binnenkort.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Nog geen toegang</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Je bent aangemeld als <strong>{session.email}</strong>, maar dit account heeft nog geen
            toegang. Vraag de beheerder om je toe te voegen.
          </p>
        </div>
      )}
      {session.status === "member" && canManageMembers(session.member.role) && (
        <Link
          href="/gebruikers"
          className={`${secondaryButtonClass} flex items-center justify-center`}
        >
          Gebruikers beheren
        </Link>
      )}
      <form action={signOut}>
        <button type="submit" className={secondaryButtonClass}>
          Afmelden
        </button>
      </form>
    </main>
  );
}
