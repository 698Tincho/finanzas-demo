"use client";

// Una ficha con un gráfico chico de barras, un mes por barra: la cifra es la del último mes con
// dato, el mes del último dato va lleno y los demás más suaves. Un mes sin dato no tiene barra (no
// es cero); los números exactos están en la tabla de la página. tope: la escala (para que varias
// fichas se puedan comparar); sin tope, cada una con la suya.

import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dolares, pesos } from "@/lib/formato";
import { CajaTooltip, corto, ejes, miles } from "./graficos";
import { IconoCalendario } from "./iconos";
import { Ficha } from "./ui";

export type PuntoBarra = { periodo: string; monto: number | null };

export function MiniBarras({
  titulo,
  icono,
  color,
  datos,
  moneda = "pesos",
  tope,
  detalle,
  derecha,
}: {
  titulo: string;
  icono?: ReactNode;
  color: string;
  datos: PuntoBarra[];
  // No una función: las páginas (del servidor) no le pueden pasar funciones a un componente del navegador
  moneda?: "pesos" | "dolares";
  tope?: number;
  detalle?: ReactNode;
  // Lo que va a la derecha del pie (el promedio, por ejemplo)
  derecha?: ReactNode;
}) {
  const formato = moneda === "dolares" ? dolares : pesos;
  const ultimo = datos.findLast((d) => d.monto != null);
  const maximo = tope ?? Math.max(1, ...datos.map((d) => d.monto ?? 0));
  // Marcas redondas: el tope se lleva al siguiente par de miles (o de decenas, para los dólares)
  const paso = maximo > 2000 ? 2000 : maximo > 20 ? 20 : 2;
  const escala = Math.ceil(maximo / paso) * paso;

  return (
    <figure className="min-w-0" aria-label={titulo}>
      <Ficha
        icono={icono}
        titulo={titulo}
        valor={ultimo ? formato(ultimo.monto!) : "—"}
        detalle={detalle}
        pie={{
          izquierda: ultimo ? (
            <>
              <IconoCalendario />
              último: {corto(ultimo.periodo)}
            </>
          ) : (
            "todavía sin datos"
          ),
          derecha,
        }}
      >
        <div
          className="h-28"
          role="img"
          aria-label={`${titulo} de ${corto(datos[0].periodo)} a ${corto(datos.at(-1)!.periodo)}; los mismos datos están en la tabla`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 4, right: 0, bottom: 0, left: 0 }} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="var(--grilla)" />
              <XAxis dataKey="periodo" tickFormatter={corto} {...ejes} interval="preserveStartEnd" minTickGap={24} />
              <YAxis
                tickFormatter={escala > 100 ? miles : (n: number) => String(n)}
                {...ejes}
                axisLine={false}
                width={escala > 100 ? 48 : 28}
                domain={[0, escala]}
                ticks={[0, escala / 2, escala]}
              />
              <Tooltip
                cursor={{ fill: "var(--tarjeta)" }}
                content={({ active, payload }) => {
                  const d = payload?.[0]?.payload as PuntoBarra | undefined;
                  if (!active || !d) return null;
                  return <CajaTooltip titulo={corto(d.periodo)} filas={[{ color, nombre: titulo, valor: d.monto == null ? "sin dato" : formato(d.monto) }]} />;
                }}
              />
              <Bar dataKey="monto" maxBarSize={18} radius={[3, 3, 0, 0]} isAnimationActive={false}>
                {datos.map((d) => (
                  <Cell key={d.periodo} fill={color} fillOpacity={d.periodo === ultimo?.periodo ? 1 : 0.55} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Ficha>
    </figure>
  );
}
