// Arriba del Resumen, tres recuadros (como los de la referencia), cada uno con su número de los
// últimos 12 meses, la comparación con los 12 anteriores y un gráfico chico:
// - Ingreso por mes (sueldo + ticket + alquiler que cobrás), con sus barras mes a mes.
// - Te queda por mes, en el recuadro verde, con sus barras.
// - Gastás por mes, con la barra de a dónde va: cada parte en su color y lo que no se gastó vacío.
// Debajo, "A dónde va": cada parte con su porcentaje del ingreso y cómo cambió.

import type { ReactNode } from "react";
import { pesos, pct, variacion } from "@/lib/formato";
import { IconoEntra, IconoSale, IconoTilde } from "./iconos";
import { MicroBarras } from "./micro-barras";
import { BarraReparto, COLORES } from "./reparto";
import { pctEntero } from "./resumen";
import { Ficha, Variacion } from "./ui";

// cobrado: sueldo en pesos + ticket + alquiler que cobrás (alquilerCobrado, para decirlo en la etiqueta)
export type Reparto = {
  cobrado: number;
  alquilerCobrado: number;
  visa: number;
  master: number;
  credito: number;
  alquiler: number;
  cuentas: number;
};

const queda = (r: Reparto) => r.cobrado - r.visa - r.master - r.credito - r.alquiler - r.cuentas;

export function CifrasResumen({
  reparto,
  anterior,
  ingresos,
  quedas,
  extra,
}: {
  reparto: Reparto;
  anterior: Reparto | null;
  // Mes a mes, de los mismos 12 meses (null: ese mes no se sabe)
  ingresos: (number | null)[];
  quedas: (number | null)[];
  extra?: ReactNode;
}) {
  const { cobrado } = reparto;
  const resto = queda(reparto);
  const gasto = cobrado - resto;
  const gastoAntes = anterior ? anterior.cobrado - queda(anterior) : null;

  const parte = (nombre: string, monto: number, antes: number | null | undefined, color: string, subirEsBueno: boolean) => ({
    nombre,
    monto,
    color,
    detalle: (
      <>
        {cobrado > 0 ? `${pct(monto / cobrado)} del ingreso` : ""}
        {antes != null && (
          <div>
            <Variacion valor={variacion(monto, antes)} subirEsBueno={subirEsBueno} /> vs. antes
          </div>
        )}
      </>
    ),
  });
  // El orden de "A dónde fue" (validado para daltonismo): Visa, Mastercard, credito, alquiler, cuentas
  const gastos = [
    parte("Tarjeta Visa", reparto.visa, anterior?.visa, COLORES.visa, false),
    parte("Tarjeta Mastercard", reparto.master, anterior?.master, COLORES.master, false),
    parte("Préstamo", reparto.credito, anterior?.credito, COLORES.credito, false),
    ...(reparto.alquiler ? [parte("Alquiler", reparto.alquiler, anterior?.alquiler, COLORES.alquiler, false)] : []),
    ...(reparto.cuentas ? [parte("Cuentas de la casa", reparto.cuentas, anterior?.cuentas, COLORES.cuentas, false)] : []),
  ];
  const partes = [...gastos, parte("Te queda", resto, anterior && queda(anterior), COLORES.queda, true)];

  return (
    <>
      <div className="mt-6 grid gap-2 md:grid-cols-3">
        <Ficha
          icono={<IconoEntra />}
          titulo="Ingreso por mes"
          valor={pesos(cobrado)}
          detalle={
            anterior ? (
              <>
                <Variacion valor={variacion(cobrado, anterior.cobrado)} subirEsBueno semaforo /> vs. antes
              </>
            ) : undefined
          }
          pie={{ izquierda: `sueldo + ticket${reparto.alquilerCobrado ? " + alquiler" : ""}` }}
        >
          <MicroBarras valores={ingresos} color="var(--texto)" etiqueta="Ingreso de cada uno de los últimos 12 meses; los números están en la tabla de Mes a mes" />
        </Ficha>

        <Ficha
          tono="queda"
          icono={<IconoTilde />}
          titulo="Te queda por mes"
          pie={{ izquierda: "ingreso − gastos" }}
          valor={<span className={resto < 0 ? "text-peor" : ""}>{pesos(resto)}</span>}
          detalle={
            <>
              {cobrado > 0 && `${pctEntero(resto / cobrado)} del ingreso`}
              {anterior && (
                <>
                  {" · "}
                  <Variacion valor={variacion(resto, queda(anterior))} subirEsBueno semaforo /> vs. antes
                </>
              )}
            </>
          }
        >
          <MicroBarras valores={quedas} color="var(--serie-cobrado)" etiqueta="Lo que te quedó cada mes; los meses sin todos los datos no tienen barra" />
        </Ficha>

        <Ficha
          icono={<IconoSale />}
          titulo="Gastás por mes"
          valor={pesos(gasto)}
          pie={{ izquierda: "lo vacío de la barra es lo que te queda" }}
          detalle={
            <>
              {cobrado > 0 && `${pctEntero(gasto / cobrado)} del ingreso`}
              {gastoAntes != null && (
                <>
                  {" · "}
                  <Variacion valor={variacion(gasto, gastoAntes)} subirEsBueno={false} /> vs. antes
                </>
              )}
            </>
          }
        >
          {/* La barra del ingreso: lo gastado en el color de cada parte, lo que no se gastó vacío */}
          <div
            role="img"
            aria-label={`Del ingreso por mes se va ${pctEntero(gasto / cobrado)}: ${gastos.map((p) => `${p.nombre} ${pesos(p.monto)}`).join(", ")}`}
            className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-tarjeta"
          >
            {gastos
              .filter((p) => p.monto > 0)
              .map((p) => (
                <div key={p.nombre} style={{ flexGrow: 0, flexBasis: `${(p.monto / Math.max(cobrado, gasto)) * 100}%`, background: p.color }} />
              ))}
          </div>
        </Ficha>
      </div>

      {extra && <div className="mt-2 text-xs">{extra}</div>}
      <section className="superficie mt-2 p-4" aria-label="A dónde va el ingreso">
        <h2 className="mb-3 text-sm font-bold">A dónde va</h2>
        <BarraReparto partes={partes} etiqueta="" sinBarra />
        {resto < 0 && <p className="mt-2 text-xs text-peor">En promedio, las tarjetas y el préstamo superan el ingreso.</p>}
      </section>
    </>
  );
}
