"use client";

// Botón del tema: dice a qué modo pasa. Cambia <html data-theme> en el momento y guarda la elección en una
// cookie por un año, para que el servidor mande las próximas páginas con ese tema.

import { useState } from "react";
import { COOKIE_TEMA, type Tema } from "@/lib/tema";

// compacto: solo el ícono (sol o luna, dibujados en SVG), para el recuadro de tu usuario en el menú
export function SelectorTema({ inicial, compacto }: { inicial: Tema; compacto?: boolean }) {
  const [tema, setTema] = useState(inicial);
  const oscuro = tema === "dark";

  function cambiar() {
    const nuevo: Tema = oscuro ? "light" : "dark";
    document.documentElement.dataset.theme = nuevo;
    document.cookie = `${COOKIE_TEMA}=${nuevo}; path=/; max-age=31536000; samesite=lax`;
    setTema(nuevo);
  }

  if (compacto) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={oscuro}
        aria-label="Modo oscuro"
        title={oscuro ? "Pasar a modo claro" : "Pasar a modo oscuro"}
        onClick={cambiar}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-borde text-suave transition-colors hover:bg-tarjeta hover:text-texto"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {oscuro ? (
            <>
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
            </>
          ) : (
            <path d="M13.5 9.6A5.75 5.75 0 0 1 6.4 2.5a5.75 5.75 0 1 0 7.1 7.1Z" />
          )}
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={oscuro}
      aria-label="Modo oscuro"
      onClick={cambiar}
      className="rounded-lg border border-borde px-2.5 py-1 text-xs font-semibold text-suave transition-colors hover:text-texto"
    >
      <span aria-hidden>{oscuro ? "☀ Modo claro" : "☾ Modo oscuro"}</span>
    </button>
  );
}
