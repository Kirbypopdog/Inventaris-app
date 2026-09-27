import Link from "next/link";
import { linkButtonClass } from "@/components/page";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Niet gevonden</h1>
        <p className="text-lg text-stone-600 dark:text-stone-400">
          Deze pagina bestaat niet, of wat je zocht werd verwijderd.
        </p>
      </div>
      <Link href="/" className={linkButtonClass}>
        Naar de startpagina
      </Link>
    </main>
  );
}
