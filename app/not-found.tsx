// Dirección que no existe. No muestra datos: se ve con cualquier cookie, válida o no.

import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="mx-auto max-w-sm px-4 pt-24 pb-16">
      <h1 className="text-2xl font-bold">Esta página no existe</h1>
      <p className="mt-2 text-sm text-suave">Revisá la dirección, o volvé al inicio.</p>
      <Link href="/" className="mt-4 inline-block text-sm font-semibold text-link hover:underline">Ir al inicio</Link>
    </main>
  );
}
