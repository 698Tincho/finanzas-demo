// Tarjetas: cuánto se va en Visa y Mastercard por mes, cada una mes a mes, los dólares aparte (no se
// suman a los pesos), el promedio por año y las cuotas que quedan del último estado de cuenta.

import type { Metadata } from "next";
import Link from "next/link";
import { SeccionCuotas } from "@/components/detalle";
import { IconoTarjeta } from "@/components/iconos";
import { MiniBarras } from "@/components/mini-barras";
import { COLORES } from "@/components/reparto";
import { mesSolo } from "@/components/resumen";
import { promedio, ventanas } from "@/components/series";
import { TarjetasPorAnio } from "@/components/tarjetas-por-anio";
import { Encabezado, Nota, Seccion, SinMeses, Variacion } from "@/components/ui";
import { BANCO, dolares, pesos, variacion } from "@/lib/formato";
import { leerMes, leerSerie, type Banco, type PuntoSerie } from "@/lib/modelo";

export const metadata: Metadata = { title: "Tarjetas · Finanzas" };

const BANCOS = Object.keys(BANCO) as Banco[];
const deBanco = (p: PuntoSerie, b: Banco) => p.tarjetas.find((t) => t.banco === b)?.uyu ?? null;
// Pesos de las dos tarjetas, solo si están los dos estados (si falta uno no se sabe el total)
const ambas = (p: PuntoSerie) => (p.tarjetas.length === BANCOS.length ? p.tarjetas.reduce((s, t) => s + t.uyu, 0) : null);
const sinNulos = (l: (number | null)[]) => l.filter((x): x is number => x != null);

export default async function PaginaTarjetas() {
  const serie = await leerSerie();
  if (!serie.length) return <SinMeses titulo="Tarjetas" />;
  const { actual, anterior, rango } = ventanas(serie);

  const totales = sinNulos(actual.map(ambas));
  const prom = promedio(totales);
  const promAntes = promedio(sinNulos(anterior.map(ambas)));
  const usd = promedio(actual.filter((p) => p.tarjetas.length).map((p) => p.tarjetas.reduce((s, t) => s + t.usd, 0)));
  const tope = Math.max(1, ...actual.flatMap((p) => p.tarjetas.map((t) => t.uyu)));
  // Las cuotas que quedan salen del último mes con algún estado de cuenta
  const ultimo = serie.findLast((p) => p.tarjetas.length);
  const mesUltimo = ultimo ? await leerMes(ultimo.periodo) : null;

  return (
    <main>
      <Encabezado
        titulo="Tarjetas"
        rango={rango}
        etiqueta="Tarjetas por mes, en pesos"
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
            ? "Todavía no hay meses con los estados de las dos tarjetas."
            : `Visa + Mastercard, en promedio de los ${totales.length} meses con los dos estados de cuenta.`
        }
      />
      {usd ? <p className="mt-1 text-xs text-suave">Además, {dolares(usd)} por mes en dólares (no se suman a los pesos).</p> : null}

      <Seccion titulo="Cada tarjeta">
        <Nota>Lo del estado de cuenta de cada mes. Las dos en pesos con la misma escala, para comparar; los dólares aparte, con la suya.</Nota>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {BANCOS.map((b) => {
            const valores = sinNulos(actual.map((p) => deBanco(p, b)));
            const media = promedio(valores);
            return (
              <MiniBarras
                key={b}
                titulo={BANCO[b]}
                icono={<IconoTarjeta color={COLORES[b]} />}
                color={COLORES[b]}
                datos={actual.map((p) => ({ periodo: p.periodo, monto: deBanco(p, b) }))}
                tope={tope}
                detalle={
                  valores.length > 1 && media != null ? (
                    <>
                      <Variacion valor={variacion(valores.at(-1)!, media)} subirEsBueno={false} /> vs. el promedio
                    </>
                  ) : undefined
                }
                derecha={media != null && valores.length > 1 ? `prom. ${pesos(media)}` : undefined}
              />
            );
          })}
          {usd ? (
            <MiniBarras
              titulo="Dólares"
              icono={<IconoTarjeta />}
              color="var(--suave)"
              moneda="dolares"
              datos={actual.map((p) => ({ periodo: p.periodo, monto: p.tarjetas.length ? p.tarjetas.reduce((s, t) => s + t.usd, 0) : null }))}
              derecha={`prom. ${dolares(usd)}`}
            />
          ) : null}
        </div>
      </Seccion>

      <TarjetasPorAnio serie={serie} />

      {mesUltimo && (
        <>
          <div className="mt-9">
            <SeccionCuotas mes={mesUltimo} />
          </div>
          <p className="mt-3 text-sm">
            <Link href={`/mes/${mesUltimo.periodo}#tarjetas`} className="text-link hover:underline">
              Ver las compras de {mesSolo(mesUltimo.nombre)}
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
