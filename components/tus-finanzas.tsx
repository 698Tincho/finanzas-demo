"use client";

// "Tus finanzas", en el Resumen (como "My Finances" de la referencia): un título y pestañas para
// cambiar entre vistas del mismo lugar, sin salir de la página. Las vistas llegan armadas del
// servidor; acá solo se elige cuál se ve. Con las flechas del teclado se pasa de una a otra.

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type Pestania = { id: string; texto: string; icono: ReactNode; contenido: ReactNode };

export function TusFinanzas({ pestanias }: { pestanias: Pestania[] }) {
  const [elegida, setElegida] = useState(pestanias[0].id);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  function tecla(e: KeyboardEvent, i: number) {
    const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!paso) return;
    const j = (i + paso + pestanias.length) % pestanias.length;
    setElegida(pestanias[j].id);
    botones.current[j]?.focus();
  }

  return (
    <section className="mt-9" aria-labelledby="tus-finanzas">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-borde pb-3">
        <h2 id="tus-finanzas" className="text-xl font-bold">
          Tus finanzas
        </h2>
        <span aria-hidden className="hidden h-5 w-px bg-borde sm:block" />
        <div role="tablist" aria-label="Vistas" className="flex gap-1">
          {pestanias.map((p, i) => {
            const activa = p.id === elegida;
            return (
              <button
                key={p.id}
                ref={(b) => {
                  botones.current[i] = b;
                }}
                type="button"
                role="tab"
                id={`pestania-${p.id}`}
                aria-selected={activa}
                aria-controls={`panel-${p.id}`}
                tabIndex={activa ? 0 : -1}
                onClick={() => setElegida(p.id)}
                onKeyDown={(e) => tecla(e, i)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                  activa ? "bg-tarjeta font-semibold text-texto ring-1 ring-borde" : "text-suave hover:text-texto"
                }`}
              >
                {p.icono}
                {p.texto}
              </button>
            );
          })}
        </div>
      </div>
      {pestanias.map((p) => (
        <div key={p.id} role="tabpanel" id={`panel-${p.id}`} aria-labelledby={`pestania-${p.id}`} hidden={p.id !== elegida} className="pt-4">
          {p.contenido}
        </div>
      ))}
    </section>
  );
}
