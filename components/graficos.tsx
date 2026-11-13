"use client";

// Piezas comunes de los gráficos (los del préstamo están en graficos-credito.tsx): colores,
// ejes, leyenda, tooltip y "Ver como tabla". Colores validados para daltonismo (ver globals.css).

import type { ReactNode } from "react";
import { Chevron } from "./ui";

export const COLOR = {
  visa: "var(--serie-visa)",
  master: "var(--serie-master)",
  credito: "var(--serie-credito)",
  queda: "var(--serie-cobrado)",
  guardia: "var(--guardia)",
};
const MES_CORTO = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
export const corto = (p: string) => `${MES_CORTO[Number(p.slice(5, 7))]} ${p.slice(2, 4)}`;
export const miles = (n: number) => (n === 0 ? "0" : `${new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(n / 1000)} mil`);

export const ejes = {
  tick: { fill: "var(--eje)", fontSize: 13 },
  axisLine: { stroke: "var(--grilla)" },
  tickLine: false,
} as const;

// ---------- Piezas comunes ----------

export function Tarjeta({ titulo, subtitulo, children, controles }: { titulo: string; subtitulo?: ReactNode; children: ReactNode; controles?: ReactNode }) {
  return (
    <figure className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <figcaption>
          <div className="text-sm font-bold">{titulo}</div>
          {subtitulo && <div className="text-xs text-suave">{subtitulo}</div>}
        </figcaption>
        {controles}
      </div>
      {children}
    </figure>
  );
}

export function Leyenda({ items }: { items: { color: string; texto: string; forma?: "barra" | "linea" | "punto" | "hueco" }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave">
      {items.map((it) => (
        <span key={it.texto} className="inline-flex items-center gap-1.5">
          {it.forma === "linea" ? (
            <span className="inline-block h-0.5 w-3.5 rounded" style={{ background: it.color }} />
          ) : it.forma === "punto" || it.forma === "hueco" ? (
            <span
              className="inline-block size-2.5 rounded-full border-2"
              style={{ borderColor: it.color, background: it.forma === "punto" ? it.color : "transparent" }}
            />
          ) : (
            <span className="inline-block size-2.5 rounded-sm" style={{ background: it.color }} />
          )}
          {it.texto}
        </span>
      ))}
    </div>
  );
}

// Caja del tooltip: texto en colores de texto, identidad en la muestra de color de al lado
export function CajaTooltip({ titulo, filas }: { titulo: string; filas: { color?: string; nombre: string; valor: string; fuerte?: boolean }[] }) {
  return (
    <div className="rounded-md border border-borde bg-fondo px-3 py-2 text-xs shadow-sm">
      <div className="mb-1 font-semibold">{titulo}</div>
      {filas.map((f) => (
        <div key={f.nombre} className={`flex items-center justify-between gap-4 ${f.fuerte ? "font-semibold" : ""}`}>
          <span className="inline-flex items-center gap-1.5 text-suave">
            {f.color && <span className="inline-block size-2 rounded-sm" style={{ background: f.color }} />}
            {f.nombre}
          </span>
          <span className="tabular-nums">{f.valor}</span>
        </div>
      ))}
    </div>
  );
}

export function VerTabla({ children }: { children: ReactNode }) {
  return (
    <details className="group mt-1 text-xs">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md py-1 font-semibold text-suave select-none hover:text-texto [&::-webkit-details-marker]:hidden">
        Ver como tabla
        <Chevron className="transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="overflow-x-auto">{children}</div>
    </details>
  );
}

