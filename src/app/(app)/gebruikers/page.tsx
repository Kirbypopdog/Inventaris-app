import type { Metadata } from "next";
import { PageHeader, pageClass } from "@/components/page";
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
    mustChangePassword: row.must_change_password,
    lastSignIn: row.last_sign_in_at
      ? `Laatst aangemeld: ${dateTimeFormat.format(new Date(row.last_sign_in_at))}`
      : "Nog nooit aangemeld",
  }));

  return (
    <main className={pageClass}>
      <PageHeader
        title="Gebruikers"
        back={{ href: "/account", label: "Meer" }}
        description="Wie hier staat, kan aanmelden met e-mailadres en wachtwoord."
      />
      <div className="grid gap-8 lg:grid-cols-[22rem_1fr] lg:items-start">
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Nieuwe gebruiker</h2>
          <AddMemberForm />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Huidige gebruikers</h2>
          <ul className="grid gap-4 xl:grid-cols-2">
            {members.map((member) => (
              <MemberCard
                key={member.userId}
                member={member}
                isSelf={member.userId === me.userId}
              />
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
