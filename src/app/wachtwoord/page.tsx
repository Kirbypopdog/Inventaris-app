import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { secondaryButtonClass } from "@/components/form";
import { signOut } from "@/lib/auth/actions";
import { requireSession } from "@/lib/auth/session";
import { PasswordForm } from "./password-form";
import { ChevronLeftIcon } from "@/components/icons";
import { quietLinkClass } from "@/components/page";

export const metadata: Metadata = { title: "Wachtwoord · Schrijnwerk" };

export default async function PasswordPage() {
  const session = await requireSession({ allowTemporaryPassword: true });
  if (session.status !== "member") {
    redirect("/");
  }
  const { mustChangePassword } = session.member;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2">
        {!mustChangePassword && (
          <Link href="/" className={`${quietLinkClass} -ml-1 self-start`}>
            <ChevronLeftIcon className="size-5" />
            Terug
          </Link>
        )}
        <h1 className="text-3xl font-semibold">
          {mustChangePassword ? "Kies je eigen wachtwoord" : "Wachtwoord wijzigen"}
        </h1>
        {mustChangePassword && (
          <p className="text-lg text-stone-600 dark:text-stone-400">
            Je meldde aan met een tijdelijk wachtwoord. Kies een eigen wachtwoord dat alleen jij
            kent.
          </p>
        )}
      </div>
      <PasswordForm />
      {mustChangePassword && (
        // Other pages are closed until a password is chosen, so logging out must be possible here.
        <form action={signOut}>
          <button type="submit" className={secondaryButtonClass}>
            Afmelden
          </button>
        </form>
      )}
    </main>
  );
}
