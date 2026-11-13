"use client";

// Cuentas de la casa mes a mes: una ficha con un gráfico chico por cuenta (UTE, Antel fijo y Antel
// Móvil), todos en el color de las cuentas y con la misma escala, para comparar su tamaño. No se usa
// un color por cuenta: cada color del sitio significa una sola cosa. Un mes sin pago no tiene barra
// (no es cero) y en la tabla va "—".

import type { Cuenta } from "@/lib/modelo";
import { pesos } from "@/lib/formato";
import { corto, VerTabla } from "./graficos";
import { IconoCelular, IconoInternet, IconoLuz } from "./iconos";
import { MiniBarras } from "./mini-barras";
import { COLORES } from "./reparto";
import { CUENTAS } from "./resumen";
import { promedio } from "./series";
import { Nota, Seccion } from "./ui";

export const ICONO_CUENTA = { ute: IconoLuz, antelFijo: IconoInternet, antelMovil: IconoCelular };

// Un mes: lo pagado de cada cuenta, o null si ese mes no hubo pago
export type MesCuentas = { periodo: string } & Record<Cuenta, number | null>;

const ORDEN: Cuenta[] = ["ute", "antelFijo", "antelMovil"];

export function GraficoCuentas({ meses, titulo = "Mes a mes" }: { meses: MesCuentas[]; titulo?: string }) {
  const conPagos = ORDEN.filter((k) => meses.some((m) => m[k] != null));
  if (!conPagos.length) {
    return (
      <Seccion titulo={titulo}>
        <Nota>Todavía no llegó ningún pago de UTE ni de Antel. Se leen solos de los mails de confirmación del banco cuando corre el pipeline.</Nota>
      </Seccion>
    );
  }
  // La misma escala en los tres gráficos, para que se vea cuál es la cuenta más cara
  const tope = Math.max(...meses.flatMap((m) => ORDEN.map((k) => m[k] ?? 0)));

  return (
    <Seccion titulo={titulo}>
      <Nota>Lo pagado cada mes (mails de confirmación del banco o facturas), una cuenta por gráfico y con la misma escala. Un mes sin barra es un mes sin pago.</Nota>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {conPagos.map((k) => {
          const pagados = meses.flatMap((m) => (m[k] == null ? [] : [m[k]]));
          const prom = promedio(pagados);
          const Icono = ICONO_CUENTA[k];
          return (
            <MiniBarras
              key={k}
              titulo={CUENTAS[k]}
              icono={<Icono color={COLORES.cuentas} />}
              color={COLORES.cuentas}
              datos={meses.map((m) => ({ periodo: m.periodo, monto: m[k] }))}
              tope={tope}
              derecha={prom != null && pagados.length > 1 ? `prom. ${pesos(prom)}` : undefined}
            />
          );
        })}
      </div>
      <VerTabla>
        <table className="my-1 w-full border-collapse">
          <thead>
            <tr className="text-suave">
              <th className="py-1 text-left font-semibold">Mes</th>
              {conPagos.map((k) => (
                <th key={k} className="py-1 text-right font-semibold">
                  {CUENTAS[k]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...meses].reverse().map((m) => (
              <tr key={m.periodo} className="border-t border-borde">
                <td className="py-1">{corto(m.periodo)}</td>
                {conPagos.map((k) => (
                  <td key={k} className="num py-1">
                    {m[k] == null ? "—" : pesos(m[k])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </VerTabla>
    </Seccion>
  );
}
