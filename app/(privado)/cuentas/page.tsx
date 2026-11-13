// Cuentas de la casa (UTE, Antel fijo y Antel Móvil): cuánto se va por mes, cómo está el último mes
// (pagada o falta) y cada cuenta mes a mes. Se leen de los mails de confirmación del banco o se cargan desde la
// factura; una cuenta se espera si se pagó en alguno de los dos meses anteriores.

import type { Metadata } from "next";
import Link from "next/link";
import { GraficoCuentas, type MesCuentas } from "@/components/grafico-cuentas";
import { fichasCuentas } from "@/components/que-llego";
import { cuentasFaltantes, mesSolo, totalCuentas } from "@/components/resumen";
import { pagadoDe, promedio, ventanas } from "@/components/series";
import { Encabezado, Nota, Seccion, SinMeses, Variacion } from "@/components/ui";
import { pesos, variacion } from "@/lib/formato";
import { leerSerie, type PuntoSerie } from "@/lib/modelo";

export const metadata: Metadata = { title: "Cuentas de la casa · Finanzas" };

export default async function PaginaCuentas() {
  const serie = await leerSerie();
  if (!serie.length) return <SinMeses titulo="Cuentas de la casa" />;
  const { actual, anterior, rango } = ventanas(serie);

  // El total de un mes, solo si llegaron todas las que se esperan y hubo alguna
  const totalMes = (p: PuntoSerie) => (p.pagos.length && !cuentasFaltantes(serie, p.periodo).length ? totalCuentas(p.pagos) : null);
  const totales = actual.map(totalMes).filter((x): x is number => x != null);
  const prom = promedio(totales);
  const promAntes = promedio(anterior.map(totalMes).filter((x): x is number => x != null));
  const meses: MesCuentas[] = actual.map((p) => ({ periodo: p.periodo, ute: pagadoDe(p, "ute"), antelFijo: pagadoDe(p, "antelFijo"), antelMovil: pagadoDe(p, "antelMovil") }));
  const ultimo = serie.at(-1)!;
  const fichas = fichasCuentas(ultimo.periodo, ultimo.pagos, serie);

  return (
    <main>
      <Encabezado
        titulo="Cuentas de la casa"
        rango={rango}
        etiqueta="Cuentas por mes"
        valor={prom == null ? "—" : pesos(prom)}
        comparacion={
          prom != null && promAntes != null ? (
            <>
              <Variacion valor={variacion(prom, promAntes)} subirEsBueno={false} /> vs. los 12 meses anteriores
            </>
          ) : undefined
        }
        nota={
          prom == null
            ? "Todavía no hay meses con todas las cuentas pagadas."
            : `UTE, Antel fijo y Antel Móvil, en promedio de los ${totales.length} meses con todas las que se esperaban.`
        }
      />

      <Seccion titulo={`En ${mesSolo(ultimo.nombre)}`}>
        {fichas.length ? (
          <>
            <Nota>Una cuenta se espera si la pagaste en alguno de los dos meses anteriores: si no llegó, falta (no es cero).</Nota>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{fichas}</div>
          </>
        ) : (
          <Nota>Ninguna cuenta pagada ni esperada este mes.</Nota>
        )}
        <p className="mt-3 text-sm">
          <Link href={`/mes/${ultimo.periodo}`} className="text-link hover:underline">
            Ver el reporte de {mesSolo(ultimo.nombre)}
          </Link>
        </p>
      </Seccion>

      <GraficoCuentas meses={meses} />
    </main>
  );
}
