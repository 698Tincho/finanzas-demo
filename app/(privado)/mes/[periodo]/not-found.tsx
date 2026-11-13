// Mes sin reporte: dirección mal escrita, o un mes que todavía no se cargó

import Link from "next/link";
import { MesCercano } from "@/components/mes-cercano";
import { leerSerie } from "@/lib/modelo";

export default async function MesNoEncontrado() {
  const serie = await leerSerie();
  const ultimo = serie.at(-1);
  return (
    <main>
      <h1 className="text-2xl font-bold">No hay reporte de ese mes</h1>
      <p className="mt-2 max-w-prose text-sm text-suave">
        Puede que la dirección esté mal escrita, o que ese mes todavía no se haya cargado.
      </p>
      <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <MesCercano meses={serie.map(({ periodo, nombre }) => ({ periodo, nombre }))} />
        {ultimo && (
          <Link href={`/mes/${ultimo.periodo}`} className="font-semibold text-link hover:underline">
            Ver {ultimo.nombre}
          </Link>
        )}
        <Link href="/" className="font-semibold text-link hover:underline">Ir al resumen</Link>
      </p>
    </main>
  );
}
