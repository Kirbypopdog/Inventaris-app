import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Aanmelden · Schrijnwerk" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Schrijnwerk</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Meld je aan met je e-mailadres. Je krijgt een code per mail, een wachtwoord is niet nodig.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
