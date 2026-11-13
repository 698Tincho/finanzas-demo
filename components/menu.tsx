"use client";

// Menú. En pantallas anchas, una columna fija como la de una app: Resumen arriba; "Tu plata"
// (Ingresos, Gastos); "Lo que pagás" (Tarjetas, Préstamo, Cuentas de la casa); los reportes de cada
// mes agrupados por año (el más nuevo abierto); y abajo Configuración, el tema y tu usuario.
//
// En el celular, una barra arriba (marca, tema, cerrar sesión) y cinco pestañas abajo, al alcance
// del pulgar: Resumen, Mes (el último, o el que estás mirando), Gastos, Préstamo y Más. Más abre
// una lista con Ingresos, Tarjetas, Cuentas de la casa y Configuración. Los demás meses se eligen
// desde el reporte del mes.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { REPO } from "@/lib/demo";
import type { Tema } from "@/lib/tema";
import {
  IconoAjustes,
  IconoCalendario,
  IconoBanco,
  IconoEntra,
  IconoLuz,
  IconoMas,
  IconoResumen,
  IconoSale,
  IconoTarjeta,
} from "./iconos";
import { Logo } from "./logo";
import { SelectorTema } from "./selector-tema";
import { Chevron } from "./ui";

// completo: tiene todos los datos para saber cuánto quedó. Si no, se marca con un punto hueco, y al
// pasar por encima (o al llegar con el teclado) se ve qué le falta (falta: "el recibo de sueldo"…)
export type GrupoMeses = {
  anio: string;
  meses: {
    periodo: string;
    nombre: string;
    completo: boolean;
    falta: string[];
  }[];
};

type Destino = { href: string; texto: string; icono: ReactNode };

// Las páginas de cada grupo, en el orden del menú. Los nombres son los títulos de las páginas.
const RESUMEN: Destino = {
  href: "/",
  texto: "Resumen",
  icono: <IconoResumen />,
};
const TU_PLATA: Destino[] = [
  { href: "/ingresos", texto: "Ingresos", icono: <IconoEntra /> },
  { href: "/gastos", texto: "Gastos", icono: <IconoSale /> },
];
const LO_QUE_PAGAS: Destino[] = [
  { href: "/tarjetas", texto: "Tarjetas", icono: <IconoTarjeta /> },
  { href: "/prestamo", texto: "Préstamo", icono: <IconoBanco /> },
  { href: "/cuentas", texto: "Cuentas de la casa", icono: <IconoLuz /> },
];
const CONFIGURACION: Destino = {
  href: "/configuracion",
  texto: "Configuración",
  icono: <IconoAjustes />,
};

export function Menu({
  grupos,
  tema,
}: {
  grupos: GrupoMeses[];
  tema: Tema;
}) {
  const ruta = usePathname();
  const ultimo = grupos[0]?.meses[0]?.periodo;

  return (
    <>
      {/* Celular: barra de arriba. h-12: la barra de secciones del mes se pega justo debajo (top-12) */}
      <div className="sticky top-0 z-20 flex h-12 items-center justify-between gap-2 border-b border-borde bg-fondo/95 px-4 backdrop-blur lg:hidden">
        <Link href="/" className="rounded-md">
          <Marca />
        </Link>
        <div className="flex items-center gap-3">
          <SelectorTema inicial={tema} />
          <span className="rounded-full bg-tarjeta px-2 py-0.5 text-xs font-semibold">Demo</span>
        </div>
      </div>

      {/* Arriba la marca y abajo Configuración y tu usuario, siempre a la vista; en el medio, las
          secciones y los meses, que se desplazan si no entran */}
      <nav
        aria-label="Menú"
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-borde bg-panel lg:flex"
      >
        <Link href="/" className="mx-3 mt-6 shrink-0 rounded-md px-2.5">
          <Marca />
        </Link>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-6 pb-4">
          <Enlace destino={RESUMEN} activo={ruta === "/"} />
          <Grupo titulo="Tu plata">
            {TU_PLATA.map((d) => (
              <Enlace key={d.href} destino={d} activo={ruta === d.href} />
            ))}
          </Grupo>
          <Grupo titulo="Lo que pagás">
            {LO_QUE_PAGAS.map((d) => (
              <Enlace key={d.href} destino={d} activo={ruta === d.href} />
            ))}
          </Grupo>

          {grupos.length > 0 && (
            <Grupo titulo="Reportes del mes">
              {grupos.map((g) => (
                // Cerrados, salvo el año del mes que estás mirando
                <details
                  key={g.anio}
                  open={g.meses.some((m) => ruta === `/mes/${m.periodo}`)}
                  className="group"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-2.5 py-1.5 text-sm select-none hover:bg-tarjeta [&::-webkit-details-marker]:hidden">
                    <span className="flex items-center gap-2.5">
                      <IconoCalendario className="text-suave" />
                      <span className="font-semibold">{g.anio}</span>
                    </span>
                    <Chevron className="text-suave transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mb-1 ml-[1.0625rem] border-l border-borde pl-2">
                    {g.meses.map((m) => (
                      <EnlaceMes
                        key={m.periodo}
                        href={`/mes/${m.periodo}`}
                        activo={ruta === `/mes/${m.periodo}`}
                        falta={m.completo ? [] : m.falta}
                      >
                        {m.nombre.split(" ")[0]}
                      </EnlaceMes>
                    ))}
                  </div>
                </details>
              ))}
            </Grupo>
          )}
        </div>

        <div className="shrink-0 px-3 pt-2 pb-4">
          <Enlace
            destino={CONFIGURACION}
            activo={ruta === CONFIGURACION.href}
          />
          {/* La línea va entre Configuración y el recuadro del demo (donde en el original va tu
              usuario): que son datos de ejemplo, el enlace al código y el tema, en text-xs */}
          <div className="mt-3 border-t border-borde pt-3">
            <div className="superficie flex items-center gap-2 p-2">
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-tarjeta text-xs font-semibold uppercase"
              >
                D
              </span>
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-xs font-semibold">Datos de ejemplo</div>
                <a href={REPO} className="text-xs text-suave hover:text-texto hover:underline">
                  Ver el código
                </a>
              </div>
              <SelectorTema inicial={tema} compacto />
            </div>
          </div>
        </div>
      </nav>

      <Pestanias ruta={ruta} ultimo={ultimo} />
    </>
  );
}

function Marca() {
  return (
    <span className="flex items-center gap-2 text-sm font-bold">
      <Logo size={20} title="" />
      Finanzas
    </span>
  );
}

// Un grupo del menú: un título chico (sin mayúsculas sostenidas) y sus enlaces
function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mt-6">
      <div className="mb-1 px-2.5 text-xs font-semibold text-suave">
        {titulo}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

const claseEnlace = (activo: boolean) =>
  `flex items-center justify-between rounded-lg px-2.5 text-sm transition-colors ${
    activo
      ? "bg-tarjeta font-semibold text-texto ring-1 ring-borde"
      : "text-suave hover:bg-tarjeta hover:text-texto"
  }`;

function Enlace({ destino, activo }: { destino: Destino; activo: boolean }) {
  return (
    <Link
      href={destino.href}
      aria-current={activo ? "page" : undefined}
      className={`${claseEnlace(activo)} py-1.5`}
    >
      <span className="flex items-center gap-2.5">
        {destino.icono}
        {destino.texto}
      </span>
    </Link>
  );
}

// falta: qué le falta al mes (vacío si está completo)
function EnlaceMes({
  href,
  activo,
  falta,
  children,
}: {
  href: string;
  activo: boolean;
  falta: string[];
  children: ReactNode;
}) {
  const texto = falta.length
    ? `Falta ${falta.length > 1 ? `${falta.slice(0, -1).join(", ")} y ${falta.at(-1)}` : falta[0]}`
    : null;
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`group/enlace ${claseEnlace(activo)} py-1`}
    >
      {children}
      {texto && (
        <>
          <PuntoFalta texto={texto} />
          <span className="sr-only">. {texto}</span>
        </>
      )}
    </Link>
  );
}

// El punto hueco de lo que falta, con un cartelito al pasar por encima (o al llegar con el teclado
// al enlace). El cartel abre hacia la izquierda, para no salirse del menú.
function PuntoFalta({ texto }: { texto: string }) {
  return (
    <span className="group/falta relative flex size-4 items-center justify-center">
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full border border-current opacity-70"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-full z-10 mb-1 hidden w-max max-w-48 rounded-lg border border-borde bg-panel px-2.5 py-1.5 text-left text-xs font-normal whitespace-normal text-texto shadow-lg group-hover/falta:block group-focus-visible/enlace:block"
      >
        {texto}
      </span>
    </span>
  );
}

// Celular: cinco pestañas abajo. "Más" abre, encima de las pestañas, la lista de las otras páginas.
function Pestanias({ ruta, ultimo }: { ruta: string; ultimo?: string }) {
  // La lista guarda en qué página se abrió: al pasar a otra página queda cerrada sola
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abierto = abiertoEn === ruta;
  const setAbierto = (a: boolean) => setAbiertoEn(a ? ruta : null);
  const lista = useRef<HTMLDivElement>(null);
  const enMes = ruta.startsWith("/mes/");
  const mas = [TU_PLATA[0], LO_QUE_PAGAS[0], LO_QUE_PAGAS[2], CONFIGURACION];
  const enMas = mas.some((d) => d.href === ruta);

  // Con Escape se cierra; al abrirse, el foco va al primer enlace
  useEffect(() => {
    if (!abierto) return;
    lista.current?.querySelector("a")?.focus();
    const tecla = (e: KeyboardEvent) =>
      e.key === "Escape" && setAbiertoEn(null);
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [abierto]);

  const pestanias: (Destino & { activo: boolean })[] = [
    { ...RESUMEN, activo: ruta === "/" && !abierto },
    ...(ultimo
      ? [
          {
            href: enMes ? ruta : `/mes/${ultimo}`,
            texto: "Mes",
            icono: <IconoCalendario />,
            activo: enMes && !abierto,
          },
        ]
      : []),
    { ...TU_PLATA[1], activo: ruta === "/gastos" && !abierto },
    { ...LO_QUE_PAGAS[1], activo: ruta === "/prestamo" && !abierto },
  ];
  const claseTab = (activo: boolean) =>
    `flex flex-col items-center gap-1 py-2 text-xs ${activo ? "font-semibold text-texto" : "text-suave"}`;

  return (
    <div className="lg:hidden">
      {abierto && (
        <div
          aria-hidden
          className="fixed inset-0 z-20 bg-fondo/60"
          onClick={() => setAbierto(false)}
        />
      )}
      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-fondo/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        {abierto && (
          <div
            ref={lista}
            id="menu-mas"
            className="mx-auto max-w-md border-b border-borde px-3 py-2"
          >
            {mas.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                aria-current={ruta === d.href ? "page" : undefined}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${ruta === d.href ? "bg-tarjeta font-semibold text-texto" : "text-texto hover:bg-tarjeta"}`}
              >
                <span className="text-suave">{d.icono}</span>
                {d.texto}
              </Link>
            ))}
          </div>
        )}
        <div className="mx-auto grid max-w-md grid-cols-5">
          {pestanias.map((p) => (
            <Link
              key={p.texto}
              href={p.href}
              aria-current={p.activo ? "page" : undefined}
              className={claseTab(p.activo)}
            >
              <span className="[&_svg]:size-[22px]">{p.icono}</span>
              {p.texto}
            </Link>
          ))}
          <button
            type="button"
            aria-expanded={abierto}
            aria-controls="menu-mas"
            onClick={() => setAbierto(!abierto)}
            className={claseTab(abierto || enMas)}
          >
            <span className="[&_svg]:size-[22px]">
              <IconoMas />
            </span>
            Más
          </button>
        </div>
      </nav>
    </div>
  );
}
