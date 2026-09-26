import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Niet gevonden</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Deze pagina bestaat niet, of wat je zocht werd verwijderd.
        </p>
      </div>
      <Link
        href="/"
        className="flex min-h-14 items-center justify-center rounded-xl bg-zinc-900 px-4 text-lg font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Naar de startpagina
      </Link>
    </main>
  );
}
