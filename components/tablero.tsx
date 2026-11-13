// Tablero del último mes, en el Resumen (como el "Budget Board" de la referencia): tres columnas,
// cada una con sus fichas y su estado. Ingresos (sueldo, ticket, alquiler que cobrás), Fijos
// (préstamo, alquiler que pagás y las cuentas de la casa que se esperan) y Tarjetas (cada estado de
// cuenta y las cuotas que quedan). Lo usan el Resumen (último mes) y el reporte de cada mes.

import Link from "next/link";
import type { ReactNode } from "react";
import type { Config, Mes, PuntoSerie } from "@/lib/modelo";
import { pesos } from "@/lib/formato";
import { IconoCasa, IconoEntra, IconoLlave, IconoRecibo, IconoTarjeta } from "./iconos";
import { cuantosFaltan, fichaCredito, fichasCuentas, fichasOtrosRecibos, fichasTarjetas, fichaSueldo, Llego } from "./que-llego";
import { COLORES } from "./reparto";
import { mesSolo, valorEn } from "./resumen";
import { Ficha, Nota } from "./ui";

function Columna({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode[] }) {
  const fichas = children.filter(Boolean);
  return (
    <section aria-label={titulo} className="min-w-0 rounded-2xl border border-borde bg-tarjeta/40 p-2">
      <h3 className="flex items-center gap-2 px-1.5 pt-1 pb-2 text-sm font-semibold">
        <span className="text-suave">{icono}</span>
        {titulo}
        <span className="rounded-md bg-tarjeta px-1.5 text-xs font-normal text-suave" aria-label={`${fichas.length} fichas`}>
          {fichas.length}
        </span>
      </h3>
      {/* En el celular, de a dos por fila dentro de la columna; en la compu, una debajo de la otra */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-1">{fichas}</div>
    </section>
  );
}

// enReporte: va en el reporte del mismo mes (sin el enlace a él)
export function Tablero({ mes, serie, config, enReporte }: { mes: Mes; serie: PuntoSerie[]; config: Config; enReporte?: boolean }) {
  const conSueldo = mes.sueldos[0] !== null;
  const cobras = valorEn(config.cobras, mes.periodo);
  const pagas = config.pagas.some((v) => v.desde <= mes.periodo) ? valorEn(config.pagas, mes.periodo) : null;
  const restaCuotas = mes.cuotas.reduce((s, c) => s + c.restaUyu, 0);
  const faltan = cuantosFaltan(mes, serie);

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <Nota>
          {faltan === 0
            ? `Todo lo de ${mesSolo(mes.nombre)} está: el recibo, los estados, el préstamo y las cuentas.`
            : `De ${mesSolo(mes.nombre)} ${faltan === 1 ? "falta 1 dato" : `faltan ${faltan} datos`}: está con borde punteado.`}
        </Nota>
        {!enReporte && (
          <Link href={`/mes/${mes.periodo}`} className="text-sm text-link hover:underline">
            Ver el reporte de {mesSolo(mes.nombre)}
          </Link>
        )}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Columna titulo="Ingresos" icono={<IconoEntra />}>
          {[
            fichaSueldo(mes, { conTicket: false }),
            ...fichasOtrosRecibos(mes),
            conSueldo && mes.resumen.tickets > 0 ? (
              <Ficha key="ticket" icono={<IconoRecibo />} titulo="Ticket" estado={<Llego>Llegó</Llego>} valor={pesos(mes.resumen.tickets)} pie={{ izquierda: "alimentación" }} />
            ) : null,
            cobras > 0 ? (
              <Ficha key="cobras" icono={<IconoCasa />} titulo="Alquiler que cobrás" valor={pesos(cobras)} pie={{ izquierda: "de Configuración" }} />
            ) : null,
          ]}
        </Columna>
        <Columna titulo="Fijos" icono={<IconoCasa />}>
          {[
            fichaCredito(mes),
            pagas != null ? (
              <Ficha key="pagas" icono={<IconoLlave color={COLORES.alquiler} />} titulo="Alquiler que pagás" valor={pesos(pagas)} pie={{ izquierda: "de Configuración" }} />
            ) : null,
            ...fichasCuentas(mes.periodo, mes.pagos ?? [], serie),
          ]}
        </Columna>
        <Columna titulo="Tarjetas" icono={<IconoTarjeta />}>
          {[
            ...fichasTarjetas(mes),
            mes.cuotas.length > 0 ? (
              <Ficha
                key="cuotas"
                icono={<IconoTarjeta />}
                titulo="Cuotas que quedan"
                valor={pesos(restaCuotas)}
                pie={{ izquierda: `${mes.cuotas.length} ${mes.cuotas.length === 1 ? "compra" : "compras"} en cuotas`, derecha: <Link href="/tarjetas" className="text-link hover:underline">ver</Link> }}
              />
            ) : null,
          ]}
        </Columna>
      </div>
    </div>
  );
}
