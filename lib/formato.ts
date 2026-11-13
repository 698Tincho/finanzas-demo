// Formato de números y fechas, igual que en el reporte por mail

const fmt0 = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 });
const fmt1 = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 });
const fmt2 = new Intl.NumberFormat("es-UY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Espacio duro entre el signo y el número: nunca se parten en dos renglones
export const pesos = (n: number) => (n < 0 ? "−$\u00a0" : "$\u00a0") + fmt0.format(Math.abs(Math.round(n)));
export const dolares = (n: number) => (n < 0 ? "−US$\u00a0" : "US$\u00a0") + fmt2.format(Math.abs(n));
// Montos grandes en dólares (el préstamo): sin centavos
export const dolaresEnteros = (n: number) => (n < 0 ? "−US$\u00a0" : "US$\u00a0") + fmt0.format(Math.abs(Math.round(n)));
export const enUI = (n: number) => `${fmt2.format(n)} UI`;
export const numero = (n: number) => fmt0.format(n);
export const pct = (x: number) => `${fmt1.format(x * 100)} %`;

// "2026-09-07" -> "07/09" y "07/09/2026"
export const diaMes = (f: string) => `${f.slice(8)}/${f.slice(5, 7)}`;
export const fechaLarga = (f: string) => f.split("-").reverse().join("/");

// "EMPRESA S.A." -> "Empresa S.A."
export const nombrePropio = (s: string) =>
  s.toLowerCase().replace(/(^|[\s.])(\p{L})/gu, (_, antes: string, letra: string) => antes + letra.toUpperCase());

// Variación porcentual con signo; null si no hay con qué comparar
export function variacion(actual: number | null | undefined, antes: number | null | undefined) {
  if (actual == null || !antes) return null;
  return (actual - antes) / Math.abs(antes);
}

export const BANCO: Record<string, string> = { visa: "Visa", master: "Mastercard" };

// "PIZZERIA DON PEPE" -> "Pizzeria Don Pepe" ("y", "de", "la"… en minúscula salvo al principio)
const MENORES = new Set(["y", "de", "del", "la", "el", "los", "las", "en"]);
export const nombreCompra = (s: string) =>
  s
    .toLowerCase()
    .split(/(\s+)/)
    .map((p, i) => (i > 0 && MENORES.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
