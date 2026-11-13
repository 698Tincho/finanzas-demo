// Marca de Finanzas: tres barras que crecen, con los colores de los datos (préstamo, Visa y lo que
// te queda). Usa los tokens --serie-*, así que sigue el tema claro u oscuro. Los íconos del sitio
// (app/icon.svg, favicon.ico y apple-icon.png) son el mismo dibujo.
// Con title="" es decorativa (al lado de la palabra "Finanzas", para no leerla dos veces).
// En desarrollo (npm run dev) va en escala de grises, para no confundir tu Mac con el sitio publicado.

const DESARROLLO = process.env.NODE_ENV === "development";

type Props = { size?: number; className?: string; title?: string };

export function Logo({ size = 20, className, title = "Finanzas" }: Props) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} role={title ? "img" : undefined} aria-label={title || undefined} aria-hidden={title ? undefined : true} className={[DESARROLLO && "grayscale", className].filter(Boolean).join(" ") || undefined}>
      <rect x="2" y="9" width="4" height="9" rx="1" fill="var(--serie-credito)" />
      <rect x="8" y="5" width="4" height="13" rx="1" fill="var(--serie-visa)" />
      <rect x="14" y="2" width="4" height="16" rx="1" fill="var(--serie-cobrado)" />
    </svg>
  );
}
