import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { PasswordForm } from "./password-form";

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
          <Link
            href="/"
            className="min-h-12 py-3 text-base text-zinc-600 underline dark:text-zinc-400"
          >
            ← Terug
          </Link>
        )}
        <h1 className="text-3xl font-semibold">
          {mustChangePassword ? "Kies je eigen wachtwoord" : "Wachtwoord wijzigen"}
        </h1>
        {mustChangePassword && (
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Je meldde aan met een tijdelijk wachtwoord. Kies een eigen wachtwoord dat alleen jij
            kent.
          </p>
        )}
      </div>
      <PasswordForm />
    </main>
  );
}
