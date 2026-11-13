"use server";

// Guardar los montos fijos de /configuracion. En el demo valida igual que en el original,
// pero no guarda nada: no hay base de datos.

import { pesos } from "@/lib/formato";

const MONTO_MAXIMO = 10_000_000;

export type EstadoMonto = { ok?: string; error?: string };

const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
const nombre = (p: string) => `${MESES[Number(p.slice(5, 7))]} ${p.slice(0, 4)}`;

export async function guardar(_previo: EstadoMonto, formulario: FormData): Promise<EstadoMonto> {
  const tipo = String(formulario.get("tipo") ?? "");
  const desde = String(formulario.get("desde") ?? "");
  // "26.500", "$ 26500" -> 26500
  const texto = String(formulario.get("monto") ?? "").replace(/\$|\s/g, "").replace(/\./g, "");
  if (!/^\d+$/.test(texto)) return { error: "Escribí el monto en pesos, solo con números (por ejemplo, 26500)." };
  const monto = Number(texto);
  if (monto > MONTO_MAXIMO) return { error: `El monto parece demasiado grande. Escribilo sin centavos (hasta ${pesos(MONTO_MAXIMO)}).` };
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(desde)) return { error: "Elegí desde qué mes vale." };
  if (tipo !== "cobras" && tipo !== "pagas") return { error: "Tipo de monto inválido." };
  return { ok: `Es un demo: no se guarda nada. En el original quedarían ${pesos(monto)} por mes desde ${nombre(desde)}.` };
}
