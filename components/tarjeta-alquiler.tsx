"use client";

// Una tarjeta de /configuracion: el monto vigente de un alquiler, el formulario para cambiarlo
// (monto y desde qué mes) y el historial. Guardar es una acción del servidor (en el demo no guarda nada).

import { useActionState, useState } from "react";
import { guardar, type EstadoMonto } from "@/app/(privado)/configuracion/acciones";
import type { ValorFijo } from "@/lib/modelo";
import { pesos } from "@/lib/formato";
import { Chevron } from "./ui";

const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
const nombreMes = (p: string) => `${MESES[Number(p.slice(5, 7))]} ${p.slice(0, 4)}`;
const enMinuscula = (p: string) => nombreMes(p).toLowerCase();

// valores: del más viejo al más nuevo. hoy: el mes actual ("AAAA-MM"). meses: los que se pueden
// elegir en "Desde", del más nuevo al más viejo.
export function TarjetaAlquiler({
  tipo,
  titulo,
  efecto,
  ayudaCero,
  color,
  valores,
  hoy,
  meses,
}: {
  tipo: "cobras" | "pagas";
  titulo: string;
  efecto: string;
  ayudaCero: string;
  color?: string;
  valores: ValorFijo[];
  hoy: string;
  meses: string[];
}) {
  const [editando, setEditando] = useState(false);
  // Al guardar bien, se cierra el formulario
  const [estado, accion, guardando] = useActionState<EstadoMonto, FormData>(async (previo, formulario) => {
    const resultado = await guardar(previo, formulario);
    if (resultado.ok) setEditando(false);
    return resultado;
  }, {});
  const recientes = [...valores].reverse();
  const vigente = recientes.find((v) => v.desde <= hoy);
  const proximo = valores.find((v) => v.desde > hoy);
  const id = `alquiler-${tipo}`;

  return (
    <div className="superficie p-4">
      <h3 className="flex items-center gap-1.5 text-sm font-bold">
        {color ? (
          <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: color }} />
        ) : (
          <span aria-hidden className="inline-block size-2.5 shrink-0 rounded-full border-[1.5px] border-texto" />
        )}
        {titulo}
      </h3>
      <div className="text-xs text-suave">{efecto}</div>

      <div className="mt-3">
        {vigente ? (
          <>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="cifra text-2xl">{pesos(vigente.monto)}</span>
              <span className="text-sm text-suave">por mes</span>
            </div>
            <div className="text-xs text-suave">desde {enMinuscula(vigente.desde)}</div>
          </>
        ) : (
          <>
            <div className="cifra text-2xl">—</div>
            <div className="text-xs text-suave">Todavía no cargaste ningún monto.</div>
          </>
        )}
        {proximo && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-tarjeta px-2 py-1 text-xs">
            <span className="text-suave">Desde {enMinuscula(proximo.desde)}:</span>
            <b className="tabular-nums">{pesos(proximo.monto)}</b>
          </div>
        )}
      </div>

      <p aria-live="polite" className="mt-2 text-xs font-semibold empty:hidden">
        {!editando && estado.ok ? `✓ ${estado.ok}` : ""}
      </p>

      {editando ? (
        <form action={accion} noValidate className="mt-3 space-y-3 rounded-lg bg-tarjeta p-3">
          <input type="hidden" name="tipo" value={tipo} />
          <div>
            <label htmlFor={`${id}-monto`} className="text-xs font-semibold text-suave">
              Monto por mes
            </label>
            <div className={`mt-1 flex items-center rounded-lg border bg-fondo focus-within:outline-2 focus-within:outline-link ${estado.error ? "border-mal" : "border-borde"}`}>
              <span aria-hidden className="pl-3 text-base text-suave">
                $
              </span>
              <input
                id={`${id}-monto`}
                name="monto"
                inputMode="numeric"
                autoComplete="off"
                defaultValue={vigente ? String(vigente.monto) : ""}
                aria-invalid={Boolean(estado.error)}
                aria-describedby={`${id}-ayuda`}
                autoFocus
                className="w-full min-w-0 rounded-lg bg-transparent px-2 py-2 text-base tabular-nums outline-none"
              />
            </div>
            <p id={`${id}-ayuda`} aria-live="polite" className={`mt-1 text-xs ${estado.error ? "text-mal" : "text-suave"}`}>
              {estado.error ?? ayudaCero}
            </p>
          </div>
          <div>
            <label htmlFor={`${id}-desde`} className="text-xs font-semibold text-suave">
              Desde
            </label>
            <select id={`${id}-desde`} name="desde" defaultValue={hoy} className="mt-1 h-10 w-full rounded-lg border border-borde bg-fondo px-2 text-base">
              {meses.map((p) => (
                <option key={p} value={p}>
                  {nombreMes(p)}
                  {p > hoy ? " (el mes que viene)" : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-suave">Los meses anteriores quedan con el monto que tenían.</p>
          </div>
          <div className="flex gap-2">
            <button disabled={guardando} className="rounded-lg bg-texto px-3 py-1.5 text-sm font-semibold text-fondo hover:opacity-90 disabled:opacity-60">
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={() => setEditando(false)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-suave hover:text-texto">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="mt-3 rounded-lg border border-borde px-3 py-1.5 text-sm font-semibold hover:bg-tarjeta"
        >
          {vigente || proximo ? "Cambiar el monto" : "Cargar el monto"}
        </button>
      )}

      {recientes.length > 1 && (
        <details className="group mt-4 text-xs">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-md py-1 font-semibold text-suave select-none hover:text-texto [&::-webkit-details-marker]:hidden">
            Historial ({recientes.length} valores)
            <Chevron className="transition-transform duration-200 group-open:rotate-90" />
          </summary>
          <ul className="mt-1 divide-y divide-borde border-y border-borde text-sm">
            {recientes.map((v) => (
              <li key={v.desde} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 py-1.5">
                <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-suave">
                  <span className="whitespace-nowrap">desde {enMinuscula(v.desde)}</span>
                  {v === vigente && <span className="rounded bg-tarjeta px-1.5 py-0.5 text-xs text-texto">vigente</span>}
                  {v.desde > hoy && <span className="rounded bg-tarjeta px-1.5 py-0.5 text-xs text-texto">próximo</span>}
                </span>
                <span className="num">{pesos(v.monto)}</span>
                {/* En el demo no se borra nada: el botón queda a la vista, apagado */}
                <button disabled title="En el demo no se borra nada" aria-label={`Borrar el monto desde ${enMinuscula(v.desde)} (no disponible en el demo)`} className="cursor-not-allowed text-xs font-semibold text-suave opacity-50">
                  Borrar
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
