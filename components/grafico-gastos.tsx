"use client";

// "Mes a mes" de /gastos: una columna por mes con lo que salió, apilado en una sola escala (así se
// comparan las partes entre sí), y la línea del promedio. Elegir una columna muestra los números de
// ese mes debajo, con el enlace a su reporte. Lo que falta no se dibuja como cero: va rayado, con
// el alto de su promedio (todavía no se sabe cuánto fue). Con "Tabla", los mismos datos.

import Link from "next/link";
import { useState } from "react";
import { pesos } from "@/lib/formato";
import { COLORES } from "./reparto";
import { Alternar, Nota, PuntoColor, SOLO_ESCRITORIO, Tabla, Td, Th } from "./ui";

// null: ese dato no llegó. El alquiler null es que no hay ninguno cargado (no falta nada).
export type MesGasto = {
  periodo: string;
  nombre: string;
  visa: number | null;
  master: number | null;
  credito: number | null;
  creditoReal: boolean;
  faltaCredito: boolean;
  alquiler: number | null;
  cuentas: number | null;
  tarjetas: number | null;
  fijo: number | null;
  total: number | null;
};
export type Promedios = { visa: number | null; master: number | null; credito: number | null; cuentas: number | null };

const MES_CORTO = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
const corto = (p: string) => MES_CORTO[Number(p.slice(5, 7))];
const monto = (n: number | null) => (n == null ? "—" : pesos(n));
const creditoTexto = (m: MesGasto) => (m.credito == null ? (m.faltaCredito ? "—" : pesos(0)) : `${m.creditoReal ? "" : "≈ "}${pesos(m.credito)}`);
const RAYADO = { backgroundImage: "repeating-linear-gradient(135deg, var(--borde) 0 3px, transparent 3px 7px)" };
const SOLO_CELULAR = "sm:hidden";

// De abajo hacia arriba: credito, Mastercard, Visa, alquiler y cuentas (el orden de "Mes a mes" del
// inicio, validado para daltonismo con la skill dataviz: no cambiarlo sin volver a validar)
function partesDe(m: MesGasto, prom: Promedios) {
  const parte = (monto: number | null, color: string, falta: boolean, promedio: number | null) =>
    monto != null ? { monto, color, falta: false } : falta ? { monto: promedio ?? 0, color, falta: true } : { monto: 0, color, falta: false };
  return [
    parte(m.credito, COLORES.credito, m.faltaCredito, prom.credito),
    parte(m.master, COLORES.master, true, prom.master),
    parte(m.visa, COLORES.visa, true, prom.visa),
    parte(m.alquiler, COLORES.alquiler, false, null),
    parte(m.cuentas, COLORES.cuentas, true, prom.cuentas),
  ].filter((p) => p.monto > 0);
}

export function GraficoGastos({ meses, promedio, promedios, conAlquiler }: { meses: MesGasto[]; promedio: number | null; promedios: Promedios; conAlquiler: boolean }) {
  const [modo, setModo] = useState<"grafico" | "tabla">("grafico");
  const [elegido, setElegido] = useState(meses.length - 1);
  const [encima, setEncima] = useState<number | null>(null);
  const alturas = meses.map((m) => partesDe(m, promedios).reduce((s, p) => s + p.monto, 0));
  const escala = Math.max(promedio ?? 0, ...alturas) * 1.08 || 1;
  const visto = meses[encima ?? elegido];
  const hayRayado = meses.some((m) => partesDe(m, promedios).some((p) => p.falta));

  const leyenda = [
    { color: COLORES.credito, texto: "Préstamo" },
    { color: COLORES.master, texto: "Mastercard" },
    { color: COLORES.visa, texto: "Visa" },
    ...(conAlquiler ? [{ color: COLORES.alquiler, texto: "Alquiler" }] : []),
    { color: COLORES.cuentas, texto: "Cuentas" },
  ];

  return (
    <section className="mt-9">
      <div className="mb-1 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl font-bold">Mes a mes</h2>
        <Alternar
          etiqueta="Ver como"
          valor={modo}
          onCambiar={setModo}
          opciones={[
            { id: "grafico", texto: "Gráfico" },
            { id: "tabla", texto: "Tabla" },
          ]}
        />
      </div>
      {modo === "grafico" ? (
        <>
          <Nota>
            Cada columna es lo que salió ese mes, todo en la misma escala. La línea punteada es el promedio. Elegí un mes para ver sus números.
            {hayRayado && " Lo rayado es un dato que todavía no llegó, dibujado con el alto de su promedio."}
          </Nota>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-suave">
            {leyenda.map((l) => (
              <span key={l.texto} className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: l.color }} />
                {l.texto}
              </span>
            ))}
            {hayRayado && (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block size-2.5 rounded-sm border border-dashed border-suave" style={RAYADO} />
                falta el dato
              </span>
            )}
            {/* El promedio va en la leyenda y no sobre la línea: ahí tapaba las columnas más altas */}
            {promedio != null && (
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="inline-block w-3.5 border-t border-dashed border-suave" />
                promedio {pesos(promedio)}
              </span>
            )}
          </div>
          <div className="relative mt-4 flex h-44 items-end gap-1 sm:gap-2" onMouseLeave={() => setEncima(null)}>
            {promedio != null && (
              <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-suave" style={{ bottom: `${(promedio / escala) * 100}%` }} />
            )}
            {meses.map((m, i) => {
              const partes = partesDe(m, promedios);
              const activo = i === (encima ?? elegido);
              return (
                <button
                  key={m.periodo}
                  type="button"
                  onClick={() => setElegido(i)}
                  onMouseEnter={() => setEncima(i)}
                  onFocus={() => setEncima(i)}
                  aria-pressed={i === elegido}
                  aria-label={`${m.nombre}: ${m.total == null ? "el total no se sabe todavía" : `salió ${pesos(m.total)}`}`}
                  className="group relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-md"
                >
                  <div
                    className={`flex w-full flex-col-reverse gap-px overflow-hidden rounded-[5px] transition-opacity duration-200 ${activo ? "opacity-100" : "opacity-55 group-hover:opacity-100"} ${i === elegido ? "ring-2 ring-texto ring-offset-2 ring-offset-fondo" : ""}`}
                    style={{ height: `${(alturas[i] / escala) * 100}%` }}
                  >
                    {partes.map((p, k) =>
                      p.falta ? (
                        <div key={k} className="border border-dashed border-suave" style={{ flexGrow: p.monto, ...RAYADO }} />
                      ) : (
                        <div key={k} style={{ flexGrow: p.monto, background: p.color }} />
                      ),
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div aria-hidden className="mt-1.5 flex gap-1 sm:gap-2">
            {meses.map((m, i) => (
              <div key={m.periodo} className={`min-w-0 flex-1 text-center text-xs ${i === elegido ? "font-semibold text-texto" : "text-suave"}`}>
                {corto(m.periodo)}
                <div className="h-4 leading-4">{m.periodo.endsWith("-01") || i === 0 ? m.periodo.slice(2, 4) : ""}</div>
              </div>
            ))}
          </div>
          <Lectura mes={visto} conAlquiler={conAlquiler} />
        </>
      ) : (
        <TablaGastos meses={meses} conAlquiler={conAlquiler} />
      )}
    </section>
  );
}

// Los números del mes elegido, debajo de las columnas
function Lectura({ mes, conAlquiler }: { mes: MesGasto; conAlquiler: boolean }) {
  const items = [
    { nombre: "Visa", monto: monto(mes.visa), color: COLORES.visa },
    { nombre: "Mastercard", monto: monto(mes.master), color: COLORES.master },
    { nombre: "Préstamo", monto: creditoTexto(mes), color: COLORES.credito },
    ...(conAlquiler || mes.alquiler ? [{ nombre: "Alquiler", monto: monto(mes.alquiler ?? 0), color: COLORES.alquiler }] : []),
    { nombre: "Cuentas", monto: monto(mes.cuentas), color: COLORES.cuentas },
    { nombre: "Total", monto: monto(mes.total), color: "var(--texto)" },
  ];
  return (
    <div className="superficie mt-5 p-4" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-bold">{mes.nombre}</div>
        <Link href={`/mes/${mes.periodo}`} className="text-sm font-semibold text-link hover:underline">
          Ver el reporte de {mes.nombre.split(" ")[0].toLowerCase()} →
        </Link>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-3">
        {items.map((it) => (
          <div key={it.nombre} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-suave">
              <PuntoColor color={it.color} className="size-2" />
              {it.nombre}
            </dt>
            <dd className={`cifra text-xl whitespace-nowrap ${it.nombre === "Total" ? "font-bold" : ""}`}>{it.monto}</dd>
          </div>
        ))}
      </dl>
      {mes.total == null && <Nota>El total va cuando estén todos los gastos del mes.</Nota>}
    </div>
  );
}

// En el celular la tabla va en cuatro columnas: mes, tarjetas, lo fijo y el total
function TablaGastos({ meses, conAlquiler }: { meses: MesGasto[]; conAlquiler: boolean }) {
  return (
    <>
      <Tabla>
        <thead>
          <tr>
            <Th>Mes</Th>
            <Th derecha className={SOLO_ESCRITORIO}>Visa</Th>
            <Th derecha className={SOLO_ESCRITORIO}>Mastercard</Th>
            <Th derecha className={SOLO_ESCRITORIO}>Préstamo</Th>
            {conAlquiler && <Th derecha className={SOLO_ESCRITORIO}>Alquiler</Th>}
            <Th derecha className={SOLO_ESCRITORIO}>Cuentas</Th>
            <Th derecha className={SOLO_CELULAR}>Tarjetas</Th>
            <Th derecha className={SOLO_CELULAR}>Fijo</Th>
            <Th derecha>Total</Th>
          </tr>
        </thead>
        <tbody>
          {[...meses].reverse().map((m) => (
            <tr key={m.periodo} className="hover:bg-tarjeta">
              <Td>
                <Link href={`/mes/${m.periodo}`} className="font-semibold whitespace-nowrap text-link hover:underline">
                  {corto(m.periodo)} {m.periodo.slice(2, 4)}
                </Link>
              </Td>
              <Td num className={SOLO_ESCRITORIO}>{monto(m.visa)}</Td>
              <Td num className={SOLO_ESCRITORIO}>{monto(m.master)}</Td>
              <Td num className={SOLO_ESCRITORIO}>{creditoTexto(m)}</Td>
              {conAlquiler && <Td num className={SOLO_ESCRITORIO}>{monto(m.alquiler ?? 0)}</Td>}
              <Td num className={SOLO_ESCRITORIO}>{monto(m.cuentas)}</Td>
              <Td num className={SOLO_CELULAR}>{monto(m.tarjetas)}</Td>
              <Td num className={SOLO_CELULAR}>{monto(m.fijo)}</Td>
              <Td num className="font-semibold">{monto(m.total)}</Td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      <Nota>
        <span className={SOLO_CELULAR}>Tarjetas es Visa + Mastercard en pesos; fijo, el préstamo, el alquiler y las cuentas. </span>
        {meses.some((m) => m.credito != null && !m.creditoReal) && "≈: credito estimada con la UI del día del débito. "}
        El total va solo en los meses con todos los gastos.
      </Nota>
    </>
  );
}
