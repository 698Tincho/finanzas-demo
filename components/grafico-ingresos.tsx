"use client";

// Ingreso mes a mes: dos tramos de un mismo gris, el sueldo en pesos abajo (fuerte) y el ticket +
// el alquiler que cobrás arriba (suave), con 2 px de separación y la punta redondeada. Un mes sin
// recibo no tiene columna (no es cero). La línea punteada es el promedio, detrás de las barras; el
// punto violeta debajo del mes, la guardia de retén. Con "Tabla", cada parte por separado.

import Link from "next/link";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pesos } from "@/lib/formato";
import { CajaTooltip, corto, ejes, Leyenda, miles } from "./graficos";
import { Alternar, MarcaGuardia, Nota, SOLO_ESCRITORIO, Tabla, Td, Th } from "./ui";

// extras: lo que el mes tuvo además del sueldo de siempre ("Aguinaldo", "Salario vacacional")
export type MesIngreso = { periodo: string; nombre: string; sueldo: number | null; ticket: number | null; alquiler: number | null; guardia: boolean; extras: string[] };

const total = (m: MesIngreso) => (m.sueldo == null ? null : m.sueldo + (m.ticket ?? 0) + (m.alquiler ?? 0));
const nombreMes = (n: string) => n.replace(/^./, (c) => c.toUpperCase());

export function GraficoIngresos({ meses, promedio }: { meses: MesIngreso[]; promedio: number | null }) {
  const [modo, setModo] = useState<"grafico" | "tabla">("grafico");
  const hayAlquiler = meses.some((m) => m.alquiler);
  const hayGuardia = meses.some((m) => m.guardia);
  // El tramo de arriba: ticket + alquiler que cobrás (cada uno por separado en el tooltip y la tabla)
  const datos = meses.map((m) => ({ ...m, extra: m.sueldo == null ? null : (m.ticket ?? 0) + (m.alquiler ?? 0) }));
  // Columnas todas iguales no se muestran en la tabla (el alquiler suele ser el mismo todo el año)
  const alquilerIgual = new Set(meses.filter((m) => m.sueldo != null).map((m) => m.alquiler)).size <= 1;

  return (
    <section className="mt-9">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl font-bold">Mes a mes</h2>
        <Alternar
          etiqueta="Ver como"
          valor={modo}
          onCambiar={setModo}
          opciones={[
            { id: "grafico", texto: "Gráfico" },
            { id: "tabla", texto: "Tabla" },
          ]}
        />
      </div>
      {modo === "grafico" ? (
        <>
          <div className="h-56" role="img" aria-label="Ingreso de cada mes partido en sueldo, ticket y alquiler que cobrás; los mismos datos están en Tabla">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--grilla)" />
                <XAxis
                  dataKey="periodo"
                  {...ejes}
                  interval={0}
                  height={42}
                  tick={({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value?: unknown } }) => {
                    const valor = String(payload?.value ?? "");
                    const m = meses.find((d) => d.periodo === valor);
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text y={12} textAnchor="middle" fill="var(--eje)" fontSize={13}>
                          {corto(valor).split(" ")[0]}
                        </text>
                        {m?.guardia && <circle cy={26} r={4} fill="var(--guardia)" />}
                      </g>
                    );
                  }}
                />
                <YAxis tickFormatter={miles} {...ejes} axisLine={false} width={52} />
                {promedio != null && (
                  // Sin etiqueta sobre la línea (chocaba con la última barra): el valor está en la leyenda
                  <ReferenceLine y={promedio} stroke="var(--eje)" strokeDasharray="3 4" />
                )}
                <Tooltip
                  cursor={{ fill: "var(--tarjeta)" }}
                  content={({ active, payload }) => {
                    const d = payload?.[0]?.payload as (MesIngreso & { extra: number | null }) | undefined;
                    if (!active || !d) return null;
                    if (d.sueldo == null) return <CajaTooltip titulo={corto(d.periodo)} filas={[{ nombre: "Recibo", valor: "todavía no está" }]} />;
                    return (
                      <CajaTooltip
                        titulo={corto(d.periodo)}
                        filas={[
                          { color: "var(--serie-sueldo)", nombre: "Sueldo en pesos", valor: pesos(d.sueldo) },
                          { color: "var(--serie-extra)", nombre: "Ticket", valor: pesos(d.ticket ?? 0) },
                          ...(d.alquiler ? [{ color: "var(--serie-extra)", nombre: "Alquiler que cobrás", valor: pesos(d.alquiler) }] : []),
                          { nombre: "Total", valor: pesos(total(d)!), fuerte: true },
                          ...(d.extras.length ? [{ nombre: "Incluye", valor: d.extras.join(", ").toLowerCase() }] : []),
                        ]}
                      />
                    );
                  }}
                />
                {/* El borde del color del fondo hace los 2 px de separación entre tramos */}
                <Bar dataKey="sueldo" stackId="i" fill="var(--serie-sueldo)" stroke="var(--fondo)" strokeWidth={2} maxBarSize={24} isAnimationActive={false} />
                <Bar dataKey="extra" stackId="i" fill="var(--serie-extra)" stroke="var(--fondo)" strokeWidth={2} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Leyenda
            items={[
              { color: "var(--serie-sueldo)", texto: "Sueldo en pesos" },
              { color: "var(--serie-extra)", texto: hayAlquiler ? "Ticket + alquiler que cobrás" : "Ticket alimentación" },
              ...(promedio != null ? [{ color: "var(--eje)", texto: `Promedio ${pesos(promedio)}`, forma: "linea" as const }] : []),
            ]}
          />
          {hayGuardia && (
            <p className="mt-1 text-xs">
              <MarcaGuardia texto="el mes tuvo guardia de retén" />
            </p>
          )}
        </>
      ) : (
        <Tabla>
          <thead>
            <tr>
              <Th>Mes</Th>
              <Th derecha>Sueldo</Th>
              <Th derecha className={SOLO_ESCRITORIO}>
                Ticket
              </Th>
              {hayAlquiler && !alquilerIgual && (
                <Th derecha className={SOLO_ESCRITORIO}>
                  Alquiler
                </Th>
              )}
              <Th derecha>Total</Th>
            </tr>
          </thead>
          <tbody>
            {[...meses].reverse().map((m) => (
              <tr key={m.periodo}>
                <Td>
                  <Link href={`/mes/${m.periodo}`} className="text-link hover:underline">
                    {nombreMes(m.nombre)}
                  </Link>
                  {m.guardia && <span aria-hidden className="ml-1.5 inline-block size-2 rounded-full bg-guardia align-middle" />}
                  {m.guardia && <span className="sr-only"> (guardia de retén)</span>}
                  {m.extras.length > 0 && <div className="text-xs text-suave">{m.extras.join(", ")}</div>}
                </Td>
                <Td num>{m.sueldo == null ? "—" : pesos(m.sueldo)}</Td>
                <Td num className={SOLO_ESCRITORIO}>
                  {m.sueldo == null ? "—" : pesos(m.ticket ?? 0)}
                </Td>
                {hayAlquiler && !alquilerIgual && (
                  <Td num className={SOLO_ESCRITORIO}>
                    {m.sueldo == null ? "—" : pesos(m.alquiler ?? 0)}
                  </Td>
                )}
                <Td num className="font-semibold">
                  {total(m) == null ? "—" : pesos(total(m)!)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      )}
      {modo === "tabla" && (
        <Nota>
          <span className="sm:hidden">En el celular van el sueldo y el total (que suma el ticket{hayAlquiler ? " y el alquiler que cobrás" : ""}). </span>
          El sueldo es lo cobrado en pesos del mes, con los recibos aparte (aguinaldo, retroactivos).
        </Nota>
      )}
      {meses.some((m) => m.sueldo == null) && <Nota>Un mes sin columna (o con “—”) es un mes sin recibo de sueldo todavía.</Nota>}
      {modo === "tabla" && hayAlquiler && alquilerIgual && (
        <Nota>El alquiler que cobrás fue {pesos(meses.find((m) => m.sueldo != null)?.alquiler ?? 0)} todos los meses: está incluido en el total.</Nota>
      )}
    </section>
  );
}
