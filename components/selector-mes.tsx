"use client";

// Navegación entre meses: anterior / siguiente y un desplegable con todos

import Link from "next/link";
import { useRouter } from "next/navigation";

type Opcion = { periodo: string; nombre: string };

export function SelectorMes({ actual, meses }: { actual: string; meses: Opcion[] }) {
  const router = useRouter();
  const i = meses.findIndex((m) => m.periodo === actual);
  const anterior = meses[i - 1];
  const siguiente = meses[i + 1];
  const flecha = "grid size-9 place-items-center rounded-lg border border-borde text-sm hover:bg-tarjeta";

  return (
    <nav className="flex items-center gap-1.5" aria-label="Cambiar de mes">
      {anterior ? (
        <Link href={`/mes/${anterior.periodo}`} className={flecha} aria-label={`Ir a ${anterior.nombre}`}>←</Link>
      ) : (
        <span className={`${flecha} opacity-30`}>←</span>
      )}
      <select
        value={actual}
        onChange={(e) => router.push(`/mes/${e.target.value}`)}
        className="h-9 rounded-lg border border-borde bg-fondo px-2 text-base sm:text-sm"
        aria-label="Mes"
      >
        {[...meses].reverse().map((m) => (
          <option key={m.periodo} value={m.periodo}>{m.nombre}</option>
        ))}
      </select>
      {siguiente ? (
        <Link href={`/mes/${siguiente.periodo}`} className={flecha} aria-label={`Ir a ${siguiente.nombre}`}>→</Link>
      ) : (
        <span className={`${flecha} opacity-30`}>→</span>
      )}
    </nav>
  );
}
