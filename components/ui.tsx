// Piezas visuales compartidas: recuadros de resumen, secciones, tablas y nombres de banco

import type { ReactNode } from "react";
import { BANCO } from "@/lib/formato";

// Estructura de todo recuadro: arriba el ícono (en el color del dato) y el nombre, a la derecha el
// estado si lo hay; la cifra; y opcional un pie separado por una línea, con la fecha a la izquierda
// y de dónde sale a la derecha. children: algo más entre la cifra y el pie (un gráfico chico). falta: el dato todavía no llegó, el borde va punteado (como lo
// rayado de las barras) y la cifra es "—".
export function Ficha({
  icono,
  titulo,
  estado,
  valor,
  detalle,
  pie,
  falta,
  tono,
  children,
}: {
  // Los dos recuadros teñidos del sitio: "queda" (verde, lo que te queda) y "credito" (violeta)
  tono?: "queda" | "credito";
  children?: ReactNode;
  icono?: ReactNode;
  titulo: ReactNode;
  estado?: ReactNode;
  valor: ReactNode;
  detalle?: ReactNode;
  pie?: { izquierda?: ReactNode; derecha?: ReactNode };
  falta?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col p-3.5 ${
        falta
          ? "rounded-2xl border border-dashed border-suave/60"
          : tono === "queda"
            ? "rounded-2xl bg-queda-fondo text-queda-texto"
            : tono === "credito"
              ? "rounded-2xl bg-credito-fondo text-credito-texto"
              : "superficie"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex min-w-0 items-center gap-1.5 text-xs ${tono ? "font-semibold" : "text-suave"}`}>
          {icono}
          <span className="truncate">{titulo}</span>
        </span>
        {estado}
      </div>
      <div className={`cifra mt-2 text-xl whitespace-nowrap sm:text-2xl ${falta ? "text-suave" : ""}`}>{valor}</div>
      {detalle && <div className={`mt-0.5 text-xs ${tono ? "" : "text-suave"}`}>{detalle}</div>}
      {/* El espacio libre va arriba del gráfico (o del pie): así los gráficos y los pies de una fila
          de recuadros quedan alineados abajo */}
      {(children || (pie && (pie.izquierda || pie.derecha))) && <div className="min-h-3 flex-1" />}
      {children}
      {children && pie && (pie.izquierda || pie.derecha) && <div className="h-3" />}
      {pie && (pie.izquierda || pie.derecha) && (
        <div className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t pt-2 text-xs ${tono ? "border-current/20" : "border-borde text-suave"}`}>
          <span className="inline-flex items-center gap-1">{pie.izquierda}</span>
          {pie.derecha && <span>{pie.derecha}</span>}
        </div>
      )}
    </div>
  );
}

// Estado de una ficha ("Llegó", "Pagada", "Falta"…): sin color, como las variaciones. Lo que falta
// va con borde punteado, el mismo lenguaje que lo rayado de las barras.
export function Estado({ children, falta }: { children: ReactNode; falta?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 text-xs leading-5 whitespace-nowrap ${falta ? "border-dashed border-suave text-texto" : "border-borde text-suave"}`}
    >
      {children}
    </span>
  );
}

export function Kpi({
  titulo,
  valor,
  detalle,
  icono,
  pie,
}: {
  titulo: ReactNode;
  valor: ReactNode;
  detalle?: ReactNode;
  icono?: ReactNode;
  pie?: { izquierda?: ReactNode; derecha?: ReactNode };
}) {
  return <Ficha icono={icono} titulo={titulo} valor={valor} detalle={detalle} pie={pie} />;
}

// Fila de recuadros con un título chico arriba
export function FilaKpi({ titulo, children }: { titulo: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-xs font-semibold text-suave">{titulo}</div>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

// id: destino de los enlaces de "En esta página"; scroll-mt deja lugar a la barra fija de arriba
export function Seccion({ titulo, id, children }: { titulo: ReactNode; id?: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-9 scroll-mt-28 lg:scroll-mt-16">
      <h2 className="mb-1 text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export function Subtitulo({ children }: { children: ReactNode }) {
  return <h3 className="mt-5 text-sm font-bold">{children}</h3>;
}

export function Nota({ children }: { children: ReactNode }) {
  return <p className="my-1.5 text-xs text-suave">{children}</p>;
}

// Tabla que se desplaza de costado en pantallas angostas
export function Tabla({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="my-2 w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

// SOLO_ESCRITORIO: columnas que en el celular se esconden para que la tabla entre sin desplazarse
export const SOLO_ESCRITORIO = "hidden sm:table-cell";

export function Th({ children, derecha, className = "" }: { children?: ReactNode; derecha?: boolean; className?: string }) {
  return (
    <th className={`border-b-2 border-borde px-2 py-1.5 text-xs font-semibold text-suave ${derecha ? "text-right" : "text-left"} ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, num, className = "" }: { children?: ReactNode; num?: boolean; className?: string }) {
  return <td className={`border-b border-borde px-2 py-1.5 ${num ? "num" : ""} ${className}`}>{children}</td>;
}

// El color del banco va en el punto, no en el texto: el rojo de Mastercard como texto se confunde
// con el rojo de "variación mala"
export function NombreBanco({ banco }: { banco: string }) {
  const color = banco === "visa" ? "bg-visa" : banco === "master" ? "bg-master" : "bg-suave";
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold whitespace-nowrap">
      <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full ${color}`} />
      {BANCO[banco] ?? banco}
    </span>
  );
}

// En el celular, donde no entra la columna Tarjeta: solo el punto del color del banco, junto al importe
export function PuntoBanco({ banco }: { banco: string }) {
  const color = banco === "visa" ? "bg-visa" : banco === "master" ? "bg-master" : "bg-suave";
  return (
    <span className="sm:hidden">
      <span aria-hidden className={`mr-1.5 inline-block size-2 rounded-full align-middle ${color}`} />
      <span className="sr-only">{BANCO[banco] ?? banco}: </span>
    </span>
  );
}

// El punto del mismo tamaño que los de las leyendas (8 px), no el carácter ●, que queda chico
export function MarcaGuardia({ texto = "incluye guardia de retén" }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-guardia">
      <span aria-hidden className="inline-block size-2 shrink-0 rounded-full bg-guardia" />
      {texto}
    </span>
  );
}

// "▲ 5,2 %": la flecha dice para dónde fue, en gris. Solo lo que empeoró (1 % o más) va en ámbar;
// lo que mejoró no se pinta. Sin subirEsBueno (un descuento del recibo) nunca se pinta.
// semaforo: verde si subió y rojo si bajó (solo en el ingreso y "Te quedó" de arriba del mes)
export function Variacion({ valor, subirEsBueno, semaforo }: { valor: number | null; subirEsBueno?: boolean; semaforo?: boolean }) {
  if (valor === null) return null;
  if (Math.abs(valor) < 0.0005) return <span className="text-suave">igual</span>;
  const peor = subirEsBueno !== undefined && valor > 0 !== subirEsBueno && Math.abs(valor) >= 0.01;
  const texto = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(Math.abs(valor * 100));
  const color = semaforo ? (valor > 0 ? "text-sube" : "text-baja") : peor ? "text-peor" : "text-suave";
  return (
    <span className={`whitespace-nowrap ${color}`}>
      <span aria-hidden>{valor > 0 ? "▲" : "▼"}</span>
      <span className="sr-only">{valor > 0 ? "subió" : "bajó"}</span> {texto} %
    </span>
  );
}

// Avance (del préstamo, en el color del préstamo, salvo que se pida otro)
export function Barra({ fraccion, color = "var(--serie-credito)" }: { fraccion: number; color?: string }) {
  return (
    <div className="my-1 h-1.5 rounded-full bg-borde">
      <div className="h-1.5 rounded-full" style={{ width: `${Math.max(1, Math.round(fraccion * 100))}%`, background: color }} />
    </div>
  );
}

export function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
      <path d="m6 4 4 4-4 4" />
    </svg>
  );
}

// La explicación larga de un número, cerrada: un renglón con ícono y flecha, y al abrirlo una caja suave
export function ComoSeCalcula({ titulo = "Cómo se calcula", children }: { titulo?: string; children: ReactNode }) {
  return (
    <details className="group my-2 text-xs">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 pr-1.5 font-semibold text-suave transition-colors select-none hover:text-texto [&::-webkit-details-marker]:hidden">
        <svg aria-hidden width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 7.2v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="8" cy="4.9" r="0.95" fill="currentColor" />
        </svg>
        {titulo}
        <Chevron className="transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="mt-1.5 max-w-prose space-y-1.5 rounded-lg border-l-2 border-borde bg-tarjeta px-3 py-2.5 text-suave">{children}</div>
    </details>
  );
}

// Interruptor "Gráfico / Tabla": todo gráfico se puede leer como tabla
export function Alternar<T extends string>({ valor, opciones, onCambiar, etiqueta }: { valor: T; opciones: { id: T; texto: string }[]; onCambiar: (v: T) => void; etiqueta: string }) {
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex rounded-lg border border-borde bg-panel p-0.5 text-xs">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={valor === o.id}
          onClick={() => onCambiar(o.id)}
          className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${valor === o.id ? "bg-tarjeta text-texto" : "text-suave hover:text-texto"}`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

// Punto de color de una serie (banco, credito, lo que queda) en leyendas y tablas
export function PuntoColor({ color, className = "" }: { color: string; className?: string }) {
  return <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-full ${className}`} style={{ background: color }} />;
}

// Arriba de cada página de un tema (Ingresos, Gastos, Tarjetas, Cuentas de la casa): el título, de
// qué meses habla y el único número principal de la pantalla, con su comparación y una nota corta
export function Encabezado({
  titulo,
  rango,
  etiqueta,
  valor,
  comparacion,
  nota,
}: {
  titulo: string;
  rango?: string;
  etiqueta: ReactNode;
  valor: ReactNode;
  comparacion?: ReactNode;
  nota?: ReactNode;
}) {
  return (
    <>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      {rango && <p className="text-sm text-suave">Últimos 12 meses ({rango})</p>}
      <section className="mt-6" aria-label={typeof etiqueta === "string" ? etiqueta : titulo}>
        <div className="text-sm text-suave">{etiqueta}</div>
        <div className="flex flex-wrap items-baseline gap-x-3">
          <span className="cifra text-hero">{valor}</span>
          {comparacion && <span className="text-sm text-suave">{comparacion}</span>}
        </div>
        {nota && <p className="mt-1 max-w-prose text-xs text-suave">{nota}</p>}
      </section>
    </>
  );
}

// Una página sin meses cargados: qué falta y cómo se carga
export function SinMeses({ titulo }: { titulo: string }) {
  return (
    <main>
      <h1 className="text-2xl font-bold">{titulo}</h1>
      <p className="mt-2 max-w-prose text-sm">Todavía no hay meses cargados.</p>
      <p className="mt-2 max-w-prose text-sm text-suave">
        Los manda el pipeline cada vez que corre en tu Mac. Para mandarlos ahora, desde la carpeta del proyecto:{" "}
        <code className="rounded bg-tarjeta px-1 py-0.5 text-texto">npm run dashboard:enviar</code>
      </p>
    </main>
  );
}
