// Cuentas comunes a las páginas de Ingresos, Gastos, Tarjetas y Cuentas de la casa: la ventana de
// 12 meses, lo de cada mes partido en sus partes y los promedios. Lo que falta es null, nunca cero.

import type { Config, Cuenta, PuntoSerie } from "@/lib/modelo";
import { CUENTAS, cuentasFaltantes, totalCuentas, valorEn, type Contexto } from "./resumen";

export const promedio = (l: number[]) => (l.length ? l.reduce((s, x) => s + x, 0) / l.length : null);

// Los últimos 12 meses hasta el último con recibo de sueldo (como el inicio), y los 12 anteriores
export function ventanas(serie: PuntoSerie[]) {
  const ultimo = serie.findLast((m) => m.sueldo)?.periodo;
  const fin = serie.findIndex((m) => m.periodo === ultimo) + 1 || serie.length;
  const actual = serie.slice(Math.max(0, fin - 12), fin);
  const anterior = serie.slice(Math.max(0, fin - 24), Math.max(0, fin - 12));
  return { actual, anterior, rango: actual.length ? `${actual[0].nombre} – ${actual.at(-1)!.nombre}` : "" };
}

// Lo que salió un mes, por parte. null: ese dato no llegó (o, el alquiler, no hay ninguno cargado).
export type Gastos = { visa: number | null; master: number | null; credito: number | null; alquiler: number | null; cuentas: number | null };

export function gastosDe(p: PuntoSerie, { serie, config }: Contexto): Gastos {
  const tarjeta = (b: string) => p.tarjetas.find((t) => t.banco === b)?.uyu ?? null;
  return {
    visa: tarjeta("visa"),
    master: tarjeta("master"),
    credito: p.credito?.total ?? null,
    alquiler: config.pagas.some((v) => v.desde <= p.periodo) ? valorEn(config.pagas, p.periodo) : null,
    // Sin pagos y sin ninguna que se espere es un cero real; si falta alguna, no se sabe
    cuentas: cuentasFaltantes(serie, p.periodo).length ? null : totalCuentas(p.pagos),
  };
}

// Las dos mitades del gasto: las tarjetas (lo que se mueve) y lo fijo (préstamo, alquiler que pagás
// y cuentas de la casa). Cada una es null si le falta una parte: un estado, el débito o una cuenta
// que se espera. El alquiler null es que no hay ninguno cargado: cuenta como cero.
export const tarjetasDe = (g: Gastos) => (g.visa == null || g.master == null ? null : g.visa + g.master);
export const fijoDe = (g: Gastos, p: PuntoSerie, serie: PuntoSerie[]) =>
  g.cuentas == null || (g.credito == null && creditoEsperada(p, serie)) ? null : (g.credito ?? 0) + (g.alquiler ?? 0) + g.cuentas;

// El préstamo se espera desde el primer mes con débito: antes de eso, no había préstamo
export const creditoEsperada = (p: PuntoSerie, serie: PuntoSerie[]) => serie.some((x) => x.credito && x.periodo <= p.periodo);

// Lo que salió en total un mes, solo si están todos los gastos (los estados, el préstamo y las
// cuentas que se esperan; el recibo de sueldo no hace falta, como en "Gastaste")
export function gastoTotal(p: PuntoSerie, ctx: Contexto) {
  const g = gastosDe(p, ctx);
  const t = tarjetasDe(g);
  const f = fijoDe(g, p, ctx.serie);
  return t == null || f == null ? null : t + f;
}

// Lo pagado de cada cuenta de la casa un mes (null si ese mes no hubo pago de esa cuenta)
export function pagadoDe(p: PuntoSerie, k: Cuenta) {
  const l = p.pagos.filter((x) => x.cuenta === k);
  return l.length ? totalCuentas(l) : null;
}

export const ingresoPartes = (p: PuntoSerie, config: Config) =>
  p.sueldo ? { sueldo: p.cobrado, ticket: p.tickets, alquiler: valorEn(config.cobras, p.periodo) } : null;

export const CUENTAS_ORDEN = Object.keys(CUENTAS) as Cuenta[];
