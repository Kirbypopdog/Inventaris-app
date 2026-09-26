import type { Metadata } from "next";
import Link from "next/link";
import { requireManager } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { AddMemberForm } from "./add-member-form";
import { MemberCard, type MemberView } from "./member-card";

export const metadata: Metadata = { title: "Gebruikers · Schrijnwerk" };

const dateTimeFormat = new Intl.DateTimeFormat("nl-BE", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export default async function MembersPage() {
  const me = await requireManager();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_members");
  if (error) {
    throw new Error(`Could not load members: ${error.message}`);
  }

  const members: MemberView[] = data.map((row) => ({
    userId: row.user_id,
    email: row.email,
    role: row.role,
    displayName: row.display_name,
    lastSignIn: row.last_sign_in_at
      ? `Laatst aangemeld: ${dateTimeFormat.format(new Date(row.last_sign_in_at))}`
      : "Nog nooit aangemeld",
  }));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 p-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="min-h-12 py-3 text-base text-zinc-600 underline dark:text-zinc-400"
        >
          ← Terug
        </Link>
        <h1 className="text-3xl font-semibold">Gebruikers</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Wie hier staat, kan aanmelden met een code per e-mail.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Nieuwe gebruiker</h2>
        <AddMemberForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Huidige gebruikers</h2>
        <ul className="flex flex-col gap-4">
          {members.map((member) => (
            <MemberCard key={member.userId} member={member} isSelf={member.userId === me.userId} />
          ))}
        </ul>
      </section>
    </main>
  );
}
