"use client";

// Compras de las tarjetas de un mes: se filtran por tarjeta y se ordenan por importe o fecha. Se ven
// las primeras 8 y el resto con "Ver las N". Pesos y dólares van por separado: no se suman.

import { useMemo, useState } from "react";
import type { Banco, Movimiento } from "@/lib/modelo";
import { BANCO, diaMes, dolares, nombreCompra, pesos } from "@/lib/formato";
import { COLORES } from "./reparto";
import { Nota, PuntoColor, SOLO_ESCRITORIO, Tabla, Td, Th } from "./ui";

type Filtro = "todas" | Banco;
const VISIBLES = 8;

// faltan: bancos sin estado de cuenta este mes
export function Movimientos({ compras, faltan, mes }: { compras: Movimiento[]; faltan: Banco[]; mes: string }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [orden, setOrden] = useState<"importe" | "fecha">("importe");
  const [todas, setTodas] = useState(false);

  // Por importe: las en pesos de mayor a menor y las en dólares al final (no se comparan entre sí)
  const filas = useMemo(() => {
    const l = compras.filter((m) => filtro === "todas" || m.banco === filtro);
    if (orden === "fecha") return [...l].sort((a, b) => b.fecha.localeCompare(a.fecha));
    return [...l.filter((m) => m.uyu > 0).sort((a, b) => b.uyu - a.uyu), ...l.filter((m) => !m.uyu && m.usd).sort((a, b) => b.usd - a.usd)];
  }, [compras, filtro, orden]);
  const visibles = todas ? filas : filas.slice(0, VISIBLES);
  const totalUyu = filas.reduce((s, m) => s + m.uyu, 0);
  const totalUsd = filas.reduce((s, m) => s + m.usd, 0);
  const cuantas = (f: Filtro) => compras.filter((m) => f === "todas" || m.banco === f).length;
  const sinEstado = filtro !== "todas" && faltan.includes(filtro);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Filtrar por tarjeta" className="flex flex-wrap gap-2">
          {(["todas", "visa", "master"] as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filtro === f}
              onClick={() => {
                setFiltro(f);
                setTodas(false);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filtro === f ? "border-texto bg-texto text-fondo" : "border-borde text-suave hover:text-texto"
              }`}
            >
              {f !== "todas" && <PuntoColor color={COLORES[f]} className="size-2" />}
              {f === "todas" ? "Todas" : BANCO[f]}
              <span className="font-normal opacity-75">{cuantas(f)}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-suave">
          Ordenar por
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as "importe" | "fecha")}
            className="h-8 rounded-lg border border-borde bg-fondo px-2 text-base text-texto sm:text-xs"
          >
            <option value="importe">importe</option>
            <option value="fecha">fecha</option>
          </select>
        </label>
      </div>

      {sinEstado ? (
        <div className="mt-4 rounded-xl border border-dashed border-borde p-5 text-sm">
          <div className="font-semibold">
            Todavía no está el estado de {BANCO[filtro]} de {mes}.
          </div>
          <p className="mt-1 text-xs text-suave">
            Llega cuando corre el pipeline en tu Mac. Para mandarlo ahora, desde la carpeta del proyecto:{" "}
            <code className="rounded bg-tarjeta px-1 py-0.5 text-texto">npm run dashboard:enviar</code>
          </p>
        </div>
      ) : filas.length === 0 ? (
        <Nota>No hay compras de esta tarjeta en el mes.</Nota>
      ) : (
        <>
          <Tabla>
            <thead>
              <tr>
                <Th className="w-16">Fecha</Th>
                <Th>Detalle</Th>
                <Th className={SOLO_ESCRITORIO}>Tarjeta</Th>
                <Th derecha>Importe</Th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((m, i) => (
                <tr key={`${m.fecha}-${m.detalle}-${i}`} className="hover:bg-tarjeta">
                  <Td className="text-suave tabular-nums">{diaMes(m.fecha)}</Td>
                  <Td>
                    {nombreCompra(m.detalle)}
                    {m.cuota && <span className="ml-2 rounded bg-tarjeta px-1.5 py-0.5 text-xs whitespace-nowrap text-suave">cuota {m.cuota}</span>}
                  </Td>
                  <Td className={SOLO_ESCRITORIO}>
                    <span className="inline-flex items-center gap-1.5 text-suave">
                      <PuntoColor color={COLORES[m.banco]} className="size-2" />
                      {BANCO[m.banco]}
                    </span>
                  </Td>
                  <Td num>
                    <span className="sm:hidden">
                      <PuntoColor color={COLORES[m.banco]} className="mr-1.5 size-2 align-middle" />
                      <span className="sr-only">{BANCO[m.banco]}: </span>
                    </span>
                    {m.uyu ? pesos(m.uyu) : <span className="text-suave">{dolares(m.usd)}</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Nota>
              {filas.length} {filas.length === 1 ? "compra" : "compras"} · {pesos(totalUyu)}
              {totalUsd ? ` y ${dolares(totalUsd)}` : ""}
            </Nota>
            {filas.length > VISIBLES && (
              <button type="button" onClick={() => setTodas(!todas)} className="text-sm font-semibold text-link hover:underline">
                {todas ? "Ver menos" : `Ver las ${filas.length}`}
              </button>
            )}
          </div>
          {filtro === "todas" && faltan.length > 0 && (
            <Nota>
              Falta el estado de {faltan.map((b) => BANCO[b]).join(" y ")}: estas son solo las de{" "}
              {(Object.keys(BANCO) as Banco[]).filter((b) => !faltan.includes(b)).map((b) => BANCO[b]).join(" y ")}.
            </Nota>
          )}
        </>
      )}
    </div>
  );
}
