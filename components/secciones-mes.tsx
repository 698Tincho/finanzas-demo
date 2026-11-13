// Enlaces a las secciones del reporte de un mes: enlaces comunes (no pestañas), pegados arriba al bajar.
// Solo en el celular: en pantallas anchas las secciones van de a dos y se ven enseguida.
// En el celular van debajo de la barra del menú (que mide h-12).

import type { Mes } from "@/lib/modelo";

export function SeccionesMes({ mes }: { mes: Mes }) {
  const { credito } = mes;
  const secciones = [
    (!credito.hayDatos || credito.mes) && { id: "credito", nombre: "Préstamo" },
    { id: "sueldo", nombre: "Sueldo" },
    { id: "cuentas-casa", nombre: "Cuentas" },
    { id: "alquileres", nombre: "Alquileres" },
    { id: "tarjetas", nombre: "Tarjetas" },
    mes.cuotas.length > 0 && { id: "cuotas", nombre: "Cuotas" },
  ].filter((s): s is { id: string; nombre: string } => Boolean(s));

  return (
    <nav
      aria-label="Secciones del mes"
      className="sticky top-12 z-10 -mx-4 mt-6 flex gap-5 md:hidden overflow-x-auto border-b border-borde bg-fondo/95 px-4 py-2 backdrop-blur lg:top-0"
    >
      {secciones.map((s) => (
        <a key={s.id} href={`#${s.id}`} className="text-sm whitespace-nowrap text-link hover:underline">
          {s.nombre}
        </a>
      ))}
    </nav>
  );
}
