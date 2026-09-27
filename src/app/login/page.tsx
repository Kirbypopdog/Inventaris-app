import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Aanmelden · Schrijnwerk" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-3">
        <BrandMark className="size-14 rounded-2xl" />
        <h1 className="text-3xl font-semibold">Schrijnwerk</h1>
        <p className="text-lg text-stone-600 dark:text-stone-400">
          Meld je aan met je e-mailadres en wachtwoord.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
