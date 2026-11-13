// Gastos: cuánto sale por mes, partido en lo fijo (préstamo, alquiler que pagás y cuentas de la casa)
// y las tarjetas, que es lo que se mueve; cada gasto en su ficha con su gráfico chico; y al
// final cómo fue cada mes, en una sola escala. Lo que falta de un mes es "—", nunca cero.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GraficoGastos, type MesGasto } from "@/components/grafico-gastos";
import { IconoCalendario, IconoBanco, IconoLlave, IconoLuz, IconoTarjeta } from "@/components/iconos";
import { MicroBarras } from "@/components/micro-barras";
import { MiniBarras } from "@/components/mini-barras";
import { COLORES } from "@/components/reparto";
import { pctEntero } from "@/components/resumen";
import { fijoDe, gastosDe, gastoTotal, creditoEsperada, promedio, tarjetasDe, ventanas, type Gastos } from "@/components/series";
import { Encabezado, Ficha, Nota, Seccion, SinMeses, Variacion } from "@/components/ui";
import { pesos, variacion } from "@/lib/formato";
import { leerConfig, leerSerie, type PuntoSerie } from "@/lib/modelo";

export const metadata: Metadata = { title: "Gastos · Finanzas" };

const conocidos = (l: (number | null)[]) => l.filter((x): x is number => x != null);

export default async function PaginaGastos() {
  const [serie, config] = await Promise.all([leerSerie(), leerConfig()]);
  if (!serie.length) return <SinMeses titulo="Gastos" />;
  const ctx = { serie, config };
  const { actual, anterior, rango } = ventanas(serie);

  const fila = (p: PuntoSerie) => {
    const g = gastosDe(p, ctx);
    return { p, g, tarjetas: tarjetasDe(g), fijo: fijoDe(g, p, serie), total: gastoTotal(p, ctx) };
  };
  const filas = actual.map(fila);
  // Los promedios de arriba salen de los mismos meses (los que tienen todos los gastos): así lo
  // fijo más las tarjetas da lo que gastás
  const resumen = (l: ReturnType<typeof fila>[]) => {
    const completos = l.filter((f) => f.total != null);
    return {
      n: completos.length,
      total: promedio(completos.map((f) => f.total!)),
      tarjetas: promedio(completos.map((f) => f.tarjetas!)),
      fijo: promedio(completos.map((f) => f.fijo!)),
    };
  };
  const ahora = resumen(filas);
  const antes = resumen(anterior.map(fila));
  const vs = (a: number | null, b: number | null, subirEsBueno?: boolean) =>
    a != null && b != null ? (
      <>
        <Variacion valor={variacion(a, b)} subirEsBueno={subirEsBueno} /> vs. antes
      </>
    ) : null;
  const parteDelTotal = (x: number | null) => (x != null && ahora.total ? `${pctEntero(x / ahora.total)} del total` : null);
  const juntos = (...l: ReactNode[]) => {
    const hay = l.filter(Boolean);
    return hay.length ? hay.map((x, i) => <span key={i}>{i > 0 && " · "}{x}</span>) : undefined;
  };

  const hayAlquiler = config.pagas.some((v) => actual.some((p) => v.desde <= p.periodo));
  const promedioDe = (k: keyof Gastos) => promedio(conocidos(filas.map((f) => f.g[k])));

  const meses: MesGasto[] = filas.map(({ p, g, tarjetas, fijo, total }) => ({
    periodo: p.periodo,
    nombre: p.nombre.replace(/^./, (c) => c.toUpperCase()),
    ...g,
    creditoReal: p.credito?.real ?? true,
    faltaCredito: g.credito == null && creditoEsperada(p, serie),
    tarjetas,
    fijo,
    total,
  }));

  type Renglon = { clave: keyof Gastos; titulo: string; icono: ReactNode; color: string; neutro?: boolean };
  const grupos: { titulo: string; renglones: Renglon[] }[] = [
    {
      titulo: "Tarjetas",
      renglones: [
        { clave: "visa", titulo: "Tarjeta Visa", icono: <IconoTarjeta color={COLORES.visa} />, color: COLORES.visa },
        { clave: "master", titulo: "Tarjeta Mastercard", icono: <IconoTarjeta color={COLORES.master} />, color: COLORES.master },
      ],
    },
    {
      titulo: "Fijo",
      renglones: [
        // El préstamo sube con la UI, no por algo que hagas: su variación no se pinta
        { clave: "credito", titulo: "Préstamo", icono: <IconoBanco color={COLORES.credito} />, color: COLORES.credito, neutro: true },
        ...(hayAlquiler
          ? [{ clave: "alquiler" as const, titulo: "Alquiler que pagás", icono: <IconoLlave color={COLORES.alquiler} />, color: COLORES.alquiler, neutro: true }]
          : []),
        { clave: "cuentas", titulo: "Cuentas de la casa", icono: <IconoLuz color={COLORES.cuentas} />, color: COLORES.cuentas },
      ],
    },
  ];

  return (
    <main>
      <Encabezado
        titulo="Gastos"
        rango={rango}
        etiqueta="Gastás por mes"
        valor={ahora.total == null ? "—" : pesos(ahora.total)}
        comparacion={
          ahora.total != null && antes.total != null ? (
            <>
              <Variacion valor={variacion(ahora.total, antes.total)} subirEsBueno={false} /> vs. los 12 meses anteriores
            </>
          ) : undefined
        }
        nota={
          ahora.total == null
            ? "Todavía no hay meses con todos los gastos (los dos estados, el préstamo y las cuentas) para armar el promedio."
            : `Promedio de los ${ahora.n} meses con todos los gastos. No cuenta los dólares de las tarjetas ni otros gastos de la cuenta.`
        }
      />

      {/* Lo que gastás, partido en lo que se mueve (las tarjetas) y lo que se repite cada mes */}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Ficha
          icono={<IconoTarjeta />}
          titulo="Tarjetas por mes"
          valor={ahora.tarjetas == null ? "—" : pesos(ahora.tarjetas)}
          detalle={juntos(parteDelTotal(ahora.tarjetas), vs(ahora.tarjetas, antes.tarjetas, false))}
          pie={{ izquierda: "Visa + Mastercard, en pesos", derecha: "lo que se mueve" }}
        >
          <MicroBarras valores={filas.map((f) => f.tarjetas)} color="var(--texto)" etiqueta="Las tarjetas de cada uno de los últimos 12 meses" />
        </Ficha>
        <Ficha
          icono={<IconoCalendario />}
          titulo="Fijo por mes"
          valor={ahora.fijo == null ? "—" : pesos(ahora.fijo)}
          detalle={juntos(parteDelTotal(ahora.fijo), vs(ahora.fijo, antes.fijo))}
          pie={{ izquierda: hayAlquiler ? "préstamo + alquiler + cuentas" : "préstamo + cuentas", derecha: "se repite cada mes" }}
        >
          <MicroBarras valores={filas.map((f) => f.fijo)} color="var(--texto)" etiqueta="Lo fijo de cada uno de los últimos 12 meses" />
        </Ficha>
      </div>

      <Seccion titulo="Cada gasto">
        <Nota>
          Cada gráfico tiene su propia escala: sirve para ver si ese gasto sube o baja. Cuánto pesa cada uno en el ingreso está en el Resumen. La variación del préstamo
          y del alquiler no se pinta: suben con la UI o el contrato, no por lo que gastes.
        </Nota>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {grupos
            .flatMap((g) => g.renglones)
            .map((r) => {
              const valores = conocidos(filas.map((f) => f.g[r.clave]));
              const media = promedio(valores);
              const ult = valores.at(-1);
              return (
                <MiniBarras
                  key={r.clave}
                  titulo={r.titulo}
                  icono={r.icono}
                  color={r.color}
                  datos={filas.map((f) => ({ periodo: f.p.periodo, monto: f.g[r.clave] }))}
                  detalle={
                    ult != null && media != null && valores.length > 1 ? (
                      <>
                        <Variacion valor={variacion(ult, media)} subirEsBueno={r.neutro ? undefined : false} /> vs. el promedio
                      </>
                    ) : undefined
                  }
                  derecha={media != null && valores.length > 1 ? `prom. ${pesos(media)}` : undefined}
                />
              );
            })}
        </div>
      </Seccion>

      <GraficoGastos
          meses={meses}
          promedio={ahora.total}
          promedios={{ visa: promedioDe("visa"), master: promedioDe("master"), credito: promedioDe("credito"), cuentas: promedioDe("cuentas") }}
          conAlquiler={hayAlquiler}
        />
    </main>
  );
}
