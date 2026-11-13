// Barra de "a dónde fue": un total partido en tarjetas, préstamo y lo que quedó, con la leyenda
// debajo (monto y un detalle por parte). La usan el inicio (promedios) y el reporte de un mes.

import type { ReactNode } from "react";
import { pesos } from "@/lib/formato";

export type Parte = { nombre: string; monto: number | null; color: string; detalle?: ReactNode };

export const COLORES = {
  visa: "var(--serie-visa)",
  master: "var(--serie-master)",
  credito: "var(--serie-credito)",
  alquiler: "var(--serie-alquiler)",
  cuentas: "var(--serie-cuentas)",
  queda: "var(--serie-cobrado)",
};

// total: si las partes no llegan (falta un estado de cuenta), el resto va rayado: todavía no se sabe
// a dónde fue. sinLeyenda: solo la barra (el mes pone su propia comparación debajo). sinBarra: solo
// la leyenda (en el Resumen la barra va dentro del recuadro de lo que gastás).
export function BarraReparto({ partes, etiqueta, total, sinLeyenda, sinBarra }: { partes: Parte[]; etiqueta: string; total?: number | null; sinLeyenda?: boolean; sinBarra?: boolean }) {
  const enBarra = partes.filter((p) => p.monto != null && p.monto > 0);
  const resto = total != null ? total - enBarra.reduce((s, p) => s + p.monto!, 0) : 0;
  return (
    <>
      {!sinBarra && <div role="img" aria-label={etiqueta} className="flex h-9 w-full gap-0.5 overflow-hidden rounded-lg">
        {enBarra.map((p) => (
          <div key={p.nombre} className="min-w-1" style={{ flexGrow: p.monto!, background: p.color }} />
        ))}
        {resto > 0 && (
          <div
            className="rounded-r-lg border border-dashed border-suave"
            style={{ flexGrow: resto, backgroundImage: "repeating-linear-gradient(135deg, var(--borde) 0 3px, transparent 3px 7px)" }}
          />
        )}
      </div>}
      {!sinLeyenda && <dl className={`${sinBarra ? "" : "mt-3"} grid grid-cols-2 gap-x-4 gap-y-3 ${partes.length > 4 ? "sm:grid-cols-3" : "sm:grid-cols-4"}`}>
        {partes.map((p) => (
          <div key={p.nombre}>
            <dt className="flex items-center gap-1.5 text-xs text-suave">
              <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
              {p.nombre}
            </dt>
            <dd className={`cifra text-xl ${p.monto != null && p.monto < 0 ? "text-peor" : ""}`}>
              {p.monto == null ? "—" : pesos(p.monto)}
            </dd>
            {p.detalle && <dd className="text-xs text-suave">{p.detalle}</dd>}
          </div>
        ))}
      </dl>}
    </>
  );
}
