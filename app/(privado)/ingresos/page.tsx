// Ingresos: cuánto entra por mes (sueldo en pesos + ticket alimentación + el alquiler que cobrás),
// cada parte por separado, mes a mes y por año. El detalle del recibo está en el reporte de cada mes.

import type { Metadata } from "next";
import { GraficoIngresos, type MesIngreso } from "@/components/grafico-ingresos";
import { IconoCasa, IconoRecibo } from "@/components/iconos";
import { mesSolo, valorEn } from "@/components/resumen";
import { ingresoPartes, promedio, ventanas } from "@/components/series";
import { Encabezado, Kpi, MarcaGuardia, Nota, Seccion, SinMeses, Tabla, Td, Th, Variacion } from "@/components/ui";
import { pesos, variacion } from "@/lib/formato";
import { leerConfig, leerSerie } from "@/lib/modelo";

export const metadata: Metadata = { title: "Ingresos · Finanzas" };

export default async function PaginaIngresos() {
  const [serie, config] = await Promise.all([leerSerie(), leerConfig()]);
  if (!serie.length) return <SinMeses titulo="Ingresos" />;
  const { actual, anterior, rango } = ventanas(serie);

  const partes = (l: typeof serie) => l.flatMap((p) => (ingresoPartes(p, config) ? [ingresoPartes(p, config)!] : []));
  const ahora = partes(actual), antes = partes(anterior);
  const totalDe = (x: { sueldo: number; ticket: number; alquiler: number }) => x.sueldo + x.ticket + x.alquiler;
  const prom = promedio(ahora.map(totalDe));
  const promAntes = promedio(antes.map(totalDe));
  const sueldo = promedio(ahora.map((x) => x.sueldo)), sueldoAntes = promedio(antes.map((x) => x.sueldo));
  const ticket = promedio(ahora.map((x) => x.ticket)), ticketAntes = promedio(antes.map((x) => x.ticket));
  // El alquiler que cobrás vigente hoy y desde cuándo (de /configuracion)
  const ultimoPeriodo = serie.at(-1)!.periodo;
  const alquiler = valorEn(config.cobras, ultimoPeriodo);
  const alquilerDesde = config.cobras.filter((v) => v.desde <= ultimoPeriodo).sort((a, b) => a.desde.localeCompare(b.desde)).at(-1);
  const guardias = actual.filter((p) => p.sueldo && p.guardia).length;

  const meses: MesIngreso[] = actual.map((p) => {
    const x = ingresoPartes(p, config);
    return { periodo: p.periodo, nombre: p.nombre, sueldo: x?.sueldo ?? null, ticket: x?.ticket ?? null, alquiler: x?.alquiler ?? null, guardia: p.sueldo && p.guardia, extras: p.extras };
  });

  // Por año: promedio por mes (los años incompletos se comparan así con los completos)
  const anios = [...new Set(serie.map((p) => p.periodo.slice(0, 4)))].reverse().map((anio) => {
    const delAnio = serie.filter((p) => p.periodo.startsWith(anio) && p.sueldo);
    return {
      anio,
      meses: delAnio.length,
      sueldo: promedio(delAnio.map((p) => p.cobrado)),
      ticket: promedio(delAnio.map((p) => p.tickets)),
      guardias: delAnio.filter((p) => p.guardia).length,
    };
  }).filter((a) => a.meses > 0);

  const vsAntes = (a: number | null, b: number | null) =>
    a != null && b != null ? (
      <>
        <Variacion valor={variacion(a, b)} subirEsBueno /> vs. antes
      </>
    ) : undefined;

  return (
    <main>
      <Encabezado
        titulo="Ingresos"
        rango={rango}
        etiqueta="Entra por mes"
        valor={prom == null ? "—" : pesos(prom)}
        comparacion={
          prom != null && promAntes != null ? (
            <>
              <Variacion valor={variacion(prom, promAntes)} subirEsBueno /> vs. los 12 meses anteriores
            </>
          ) : undefined
        }
        nota={
          prom == null
            ? "Todavía no hay ningún recibo de sueldo en estos meses."
            : `Sueldo en pesos + ticket alimentación + el alquiler que cobrás, en promedio de los ${ahora.length} meses con recibo.`
        }
      />
      {guardias > 0 && (
        <p className="mt-1 text-xs">
          <MarcaGuardia texto={`guardia de retén en ${guardias} de ${ahora.length} meses`} />
        </p>
      )}

      <div className={`mt-6 grid gap-2 ${alquiler > 0 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
        <Kpi icono={<IconoRecibo />} titulo="Sueldo en pesos (prom.)" valor={sueldo == null ? "—" : pesos(sueldo)} detalle={vsAntes(sueldo, sueldoAntes)} />
        <Kpi icono={<IconoRecibo />} titulo="Ticket (prom.)" valor={ticket == null ? "—" : pesos(ticket)} detalle={vsAntes(ticket, ticketAntes)} />
        {alquiler > 0 && (
          <Kpi
            icono={<IconoCasa />}
            titulo="Alquiler que cobrás"
            valor={pesos(alquiler)}
            detalle={alquilerDesde ? `desde ${mesSolo(nombreDe(alquilerDesde.desde))}` : undefined}
          />
        )}
      </div>

      <GraficoIngresos meses={meses} promedio={prom} />

      {anios.length > 0 && (
        <Seccion titulo="Por año">
          <Nota>Promedio por mes, para poder comparar años que no están completos. Sin el alquiler que cobrás.</Nota>
          <Tabla>
            <thead>
              <tr>
                <Th>Año</Th>
                <Th derecha>Sueldo en pesos</Th>
                <Th derecha>Ticket</Th>
                {anios.some((a) => a.guardias) && <Th derecha>Guardia</Th>}
              </tr>
            </thead>
            <tbody>
              {anios.map((a) => (
                <tr key={a.anio}>
                  <Td>
                    <span className="font-semibold">{a.anio}</span>
                    <div className="text-xs text-suave">
                      {a.meses} {a.meses === 1 ? "mes" : "meses"}
                    </div>
                  </Td>
                  <Td num>{a.sueldo == null ? "—" : pesos(a.sueldo)}</Td>
                  <Td num>{a.ticket == null ? "—" : pesos(a.ticket)}</Td>
                  {anios.some((x) => x.guardias) && (
                    <Td num className="text-suave">
                      {a.guardias} {a.guardias === 1 ? "mes" : "meses"}
                    </Td>
                  )}
                </tr>
              ))}
            </tbody>
          </Tabla>
          <Nota>El detalle de cada recibo (bruto, descuentos, líquido) está en el reporte de su mes.</Nota>
        </Seccion>
      )}
    </main>
  );
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
// "2026-01" -> "enero 2026"
const nombreDe = (periodo: string) => `${MESES[Number(periodo.slice(5, 7)) - 1]} ${periodo.slice(0, 4)}`;
