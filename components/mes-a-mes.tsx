"use client";

// Mes a mes, en el inicio: una columna por mes (el ingreso partido en a dónde fue) con la línea del
// promedio. Elegir una columna muestra los números de ese mes debajo, con el enlace a su reporte.
// Lo que falta de un mes no se dibuja como cero: va rayado. Con "Tabla", los mismos datos.

import Link from "next/link";
import { useState } from "react";
import { pesos } from "@/lib/formato";
import { COLORES } from "./reparto";
import { Alternar, Nota, PuntoColor, SOLO_ESCRITORIO, Tabla, Td, Th } from "./ui";

// Los montos que faltan son null (no cero); falta dice qué falta para saber cuánto quedó
export type ColumnaMes = {
  periodo: string;
  nombre: string;
  ingreso: number | null;
  visa: number | null;
  master: number | null;
  credito: number | null;
  creditoReal: boolean;
  // Alquiler que pagás (null si nunca se cargó) y cuentas de la casa (null si no hubo pagos)
  alquiler: number | null;
  cuentas: number | null;
  queda: number | null;
  guardia: boolean;
  falta: string[];
};

const MES_CORTO = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
const corto = (p: string) => MES_CORTO[Number(p.slice(5, 7))];
const monto = (n: number | null) => (n == null ? "—" : pesos(n));
const y = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} y ${l.at(-1)}` : l[0]);

// enPestania: va dentro de las pestañas de "Tus finanzas" (el nombre lo dice la pestaña)
export function MesAMes({ meses, promedio, enPestania }: { meses: ColumnaMes[]; promedio: number; enPestania?: boolean }) {
  const [modo, setModo] = useState<"grafico" | "tabla">("grafico");
  const [elegido, setElegido] = useState(meses.length - 1);
  const [encima, setEncima] = useState<number | null>(null);
  const escala = Math.max(...meses.map((m) => m.ingreso ?? (m.visa ?? 0) + (m.master ?? 0) + (m.credito ?? 0) + (m.alquiler ?? 0) + (m.cuentas ?? 0))) * 1.08;
  const visto = meses[encima ?? elegido];

  return (
    <section className={enPestania ? "" : "mt-9"}>
      <div className={`mb-1 flex flex-wrap items-end gap-x-4 gap-y-2 ${enPestania ? "justify-end" : "justify-between"}`}>
        {!enPestania && <h2 className="text-xl font-bold">Mes a mes</h2>}
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
          <Nota>Cada columna es el ingreso del mes partido en a dónde fue. La línea punteada es el promedio. Elegí un mes para ver sus números.</Nota>
          <div className="relative mt-4 flex h-44 items-end gap-1 sm:gap-2" onMouseLeave={() => setEncima(null)}>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-suave" style={{ bottom: `${(promedio / escala) * 100}%` }}>
              <span className="absolute -top-5 right-0 bg-fondo pl-1 text-xs text-suave">prom. {pesos(promedio)}</span>
            </div>
            {meses.map((m, i) => (
              <Columna
                key={m.periodo}
                mes={m}
                escala={escala}
                activo={i === (encima ?? elegido)}
                elegido={i === elegido}
                onElegir={() => setElegido(i)}
                onEncima={() => setEncima(i)}
              />
            ))}
          </div>
          <div aria-hidden className="mt-1.5 flex gap-1 sm:gap-2">
            {meses.map((m, i) => (
              <div key={m.periodo} className={`min-w-0 flex-1 text-center text-xs ${i === elegido ? "font-semibold text-texto" : "text-suave"}`}>
                {corto(m.periodo)}
                <div className="h-4 leading-4">
                  {m.periodo.endsWith("-01") || i === 0 ? m.periodo.slice(2, 4) : m.guardia ? <span className="text-guardia">●</span> : ""}
                </div>
              </div>
            ))}
          </div>
          <Lectura mes={visto} />
        </>
      ) : (
        <TablaMeses meses={meses} />
      )}
    </section>
  );
}

function Columna({ mes, escala, activo, elegido, onElegir, onEncima }: { mes: ColumnaMes; escala: number; activo: boolean; elegido: boolean; onElegir: () => void; onEncima: () => void }) {
  const conocido = (mes.visa ?? 0) + (mes.master ?? 0) + (mes.credito ?? 0) + (mes.alquiler ?? 0) + (mes.cuentas ?? 0);
  // De abajo hacia arriba: credito, Mastercard, Visa, alquiler, cuentas y lo que quedó (orden
  // validado para daltonismo con la skill dataviz: no cambiarlo sin volver a validar)
  const partes = [
    { color: COLORES.credito, monto: mes.credito ?? 0 },
    { color: COLORES.master, monto: mes.master ?? 0 },
    { color: COLORES.visa, monto: mes.visa ?? 0 },
    { color: COLORES.alquiler, monto: mes.alquiler ?? 0 },
    { color: COLORES.cuentas, monto: mes.cuentas ?? 0 },
    { color: COLORES.queda, monto: mes.queda != null ? Math.max(0, mes.queda) : 0 },
  ].filter((p) => p.monto > 0);
  const sinSaber = mes.queda == null && mes.ingreso != null ? Math.max(0, mes.ingreso - conocido) : 0;
  const alto = ((mes.ingreso ?? conocido) / escala) * 100;

  return (
    <button
      type="button"
      onClick={onElegir}
      onMouseEnter={onEncima}
      onFocus={onEncima}
      aria-pressed={elegido}
      aria-label={`${mes.nombre}: ingreso ${monto(mes.ingreso)}, te quedó ${mes.queda == null ? `sin dato (falta ${y(mes.falta)})` : pesos(mes.queda)}`}
      className="group relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-md"
    >
      <div
        className={`flex w-full flex-col-reverse gap-px overflow-hidden rounded-[5px] transition-opacity duration-200 ${activo ? "opacity-100" : "opacity-55 group-hover:opacity-100"} ${elegido ? "ring-2 ring-texto ring-offset-2 ring-offset-fondo" : ""}`}
        style={{ height: `${alto}%` }}
      >
        {partes.map((p, k) => (
          <div key={k} style={{ flexGrow: p.monto, background: p.color }} />
        ))}
        {sinSaber > 0 && (
          <div
            className="border border-dashed border-suave"
            style={{ flexGrow: sinSaber, backgroundImage: "repeating-linear-gradient(135deg, var(--borde) 0 3px, transparent 3px 7px)" }}
          />
        )}
      </div>
    </button>
  );
}

// Los números del mes elegido, debajo de la tira
function Lectura({ mes }: { mes: ColumnaMes }) {
  const items = [
    { nombre: "Ingreso", monto: monto(mes.ingreso), color: "var(--texto)" },
    { nombre: "Visa", monto: monto(mes.visa), color: COLORES.visa },
    { nombre: "Mastercard", monto: monto(mes.master), color: COLORES.master },
    { nombre: "Préstamo", monto: mes.credito == null ? "—" : `${mes.creditoReal ? "" : "≈ "}${pesos(mes.credito)}`, color: COLORES.credito },
    ...(mes.alquiler != null ? [{ nombre: "Alquiler", monto: pesos(mes.alquiler), color: COLORES.alquiler }] : []),
    ...(mes.cuentas != null ? [{ nombre: "Cuentas", monto: pesos(mes.cuentas), color: COLORES.cuentas }] : []),
    { nombre: "Te quedó", monto: monto(mes.queda), color: COLORES.queda },
  ];
  return (
    <div className="superficie mt-5 p-4" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-bold">{mes.nombre}</div>
        <Link href={`/mes/${mes.periodo}`} className="text-sm font-semibold text-link hover:underline">
          Ver el reporte de {mes.nombre.split(" ")[0].toLowerCase()} →
        </Link>
      </div>
      <dl className={`mt-3 grid grid-cols-3 gap-x-4 gap-y-3 ${items.length > 5 ? "sm:grid-cols-4" : "sm:grid-cols-5"}`}>
        {items.map((it) => (
          <div key={it.nombre} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-suave">
              <PuntoColor color={it.color} className="size-2" />
              {it.nombre}
            </dt>
            <dd className="cifra text-xl whitespace-nowrap">{it.monto}</dd>
          </div>
        ))}
      </dl>
      {mes.queda == null && mes.falta.length > 0 && <Nota>Falta {y(mes.falta)} para saber cuánto te quedó.</Nota>}
    </div>
  );
}

function TablaMeses({ meses }: { meses: ColumnaMes[] }) {
  return (
    <Tabla>
      <thead>
        <tr>
          <Th>Mes</Th>
          <Th derecha>Ingreso</Th>
          <Th derecha className={SOLO_ESCRITORIO}>Visa</Th>
          <Th derecha className={SOLO_ESCRITORIO}>Mastercard</Th>
          <Th derecha>Préstamo</Th>
          <Th derecha className={SOLO_ESCRITORIO}>Alquiler</Th>
          <Th derecha className={SOLO_ESCRITORIO}>Cuentas</Th>
          <Th derecha>Te quedó</Th>
        </tr>
      </thead>
      <tbody>
        {[...meses].reverse().map((m) => (
          <tr key={m.periodo} className="hover:bg-tarjeta">
            <Td>
              <Link href={`/mes/${m.periodo}`} className="font-semibold text-link hover:underline">
                {corto(m.periodo)} {m.periodo.slice(2, 4)}
              </Link>
              {m.guardia && <span className="ml-1.5 text-xs text-guardia" title="incluye guardia de retén">●</span>}
            </Td>
            <Td num>{monto(m.ingreso)}</Td>
            <Td num className={SOLO_ESCRITORIO}>{monto(m.visa)}</Td>
            <Td num className={SOLO_ESCRITORIO}>{monto(m.master)}</Td>
            <Td num>{m.credito == null ? "—" : `${m.creditoReal ? "" : "≈ "}${pesos(m.credito)}`}</Td>
            <Td num className={SOLO_ESCRITORIO}>{monto(m.alquiler)}</Td>
            <Td num className={SOLO_ESCRITORIO}>{monto(m.cuentas)}</Td>
            <Td num className={`font-semibold ${m.queda != null && m.queda < 0 ? "text-peor" : ""}`}>{monto(m.queda)}</Td>
          </tr>
        ))}
      </tbody>
    </Tabla>
  );
}
