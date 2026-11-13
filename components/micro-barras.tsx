// Barras chiquitas sin ejes, una por mes, dentro de un recuadro (como el de la referencia): se lee
// la forma, no los valores. Los números exactos están en la tabla de la página. El último mes va
// lleno y los demás más suaves; un mes sin dato no tiene barra (no es cero). Con valores negativos
// (en el costo neto del préstamo, un mes en que el alquiler pasa el débito) las barras salen de
// una línea al medio: para arriba en el color, para abajo en gris (colorNegativo).

export function MicroBarras({
  valores,
  color,
  etiqueta,
  colorNegativo = "var(--suave)",
  alto = "h-10",
}: {
  valores: (number | null)[];
  color: string;
  etiqueta: string;
  colorNegativo?: string;
  // El alto de la tira (en una lista de renglones va más baja)
  alto?: string;
}) {
  const arriba = Math.max(0, ...valores.map((v) => v ?? 0));
  const abajo = Math.max(0, ...valores.map((v) => -(v ?? 0)));
  const total = arriba + abajo || 1;
  // Qué parte del alto va arriba de la línea (todo, si no hay negativos)
  const parteArriba = abajo ? arriba / total : 1;
  const ultimo = valores.findLastIndex((v) => v != null);

  return (
    <div role="img" aria-label={etiqueta} className={`flex ${alto} gap-[3px]`}>
      {valores.map((v, i) => (
        <div key={i} className="flex h-full flex-1 flex-col">
          <div className="flex items-end" style={{ height: `${parteArriba * 100}%` }}>
            {v != null && v >= 0 && (
              <div className="w-full rounded-[2px]" style={{ height: `${Math.max(6, (v / (arriba || 1)) * 100)}%`, background: color, opacity: i === ultimo ? 1 : 0.45 }} />
            )}
          </div>
          {abajo > 0 && (
            <div className="flex flex-1 items-start border-t border-borde">
              {v != null && v < 0 && <div className="w-full rounded-[2px]" style={{ height: `${Math.max(6, (-v / abajo) * 100)}%`, background: colorNegativo, opacity: i === ultimo ? 1 : 0.55 }} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
