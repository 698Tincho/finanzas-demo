// Los datos del demo: 30 meses inventados, con la misma forma que arma el pipeline del proyecto
// original. Siempre genera lo mismo para el mismo mes, así que las páginas se pueden armar al
// compilar. Los nombres, comercios y montos son de ejemplo.

import type { Banco, Config, Cuota, Mes, Movimiento, PagoCuenta, Sueldo, Tarjeta } from "./modelo";

export const MESES = 30;
const NOMBRES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
const COMERCIOS = ["SUPERMERCADO DEL CENTRO", "FARMACIA LA ESQUINA", "ESTACION RUTA 5", "LIBRERIA PAPEL Y TINTA", "FERRETERIA EL TORNILLO", "PIZZERIA DON PEPE", "TIENDA DEPORTES SUR", "VETERINARIA HUELLAS", "OPTICA BUENA VISTA", "CINE PLAZA"];
const EN_DOLARES = ["MUSICA ONLINE", "PELICULAS ONLINE", "NUBE DE FOTOS"];
const BANCOS: Banco[] = ["visa", "master"];

const dos = (n: number) => String(n).padStart(2, "0");
const cent = (n: number) => Math.round(n * 100) / 100;
export const mover = (periodo: string, meses: number) => {
  const [a, m] = periodo.split("-").map(Number);
  const d = new Date(a, m - 1 + meses, 1);
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}`;
};
export const nombreMes = (periodo: string) => `${NOMBRES[Number(periodo.slice(5))]} ${periodo.slice(0, 4)}`;

// Números "al azar" que dependen solo del texto: el mismo mes da siempre los mismos datos
function azar(semilla: string) {
  let h = 2166136261;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const hoy = new Date();
export const ultimo = `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}`;
export const primero = mover(ultimo, -(MESES - 1));
const indice = (p: string) => (Number(p.slice(0, 4)) - Number(primero.slice(0, 4))) * 12 + Number(p.slice(5)) - Number(primero.slice(5));
const enRango = (p: string) => indice(p) >= 0 && indice(p) < MESES;

function sueldoDe(p: string): { guardia: boolean; vacacional: number; sueldo: Sueldo } | null {
  const i = indice(p);
  if (!enRango(p)) return null;
  const guardia = azar(`guardia ${p}`)() < 0.3;
  // En enero, licencia con salario vacacional (como en un recibo real)
  const vacacional = p.slice(5) === "01" ? 30000 : 0;
  const base = Math.round(82000 * 1.006 ** i);
  const bruto = base + (guardia ? 9500 : 0) + vacacional;
  const haberes = [
    { concepto: "Sueldo mensual", importe: base },
    ...(vacacional ? [{ concepto: "Salario vacacional", importe: vacacional }] : []),
    ...(guardia ? [{ concepto: "Guardia de retén", importe: 9500 }] : []),
  ];
  const descuentos = {
    "Aporte jubilatorio": Math.round(bruto * 0.15),
    FONASA: Math.round(bruto * 0.045),
    "Fondo de Reconversión Laboral": Math.round(bruto * 0.001),
    IRPF: Math.round(bruto * 0.06),
  };
  const totalDescuentos = Object.values(descuentos).reduce((s, x) => s + x, 0);
  return { guardia, vacacional, sueldo: { liquido: bruto - totalDescuentos, bruto, cobertura: 0, descuentos, totalDescuentos, haberes, licencia: vacacional > 0 } };
}

function movimientosDe(p: string): Movimiento[] {
  const r = azar(`tarjetas ${p}`);
  const lista: Movimiento[] = [];
  for (const banco of BANCOS) {
    for (let k = 0; k < 4 + Math.floor(r() * 5); k++) {
      const enCuotas = r() < 0.2;
      const total = 2 + Math.floor(r() * 5);
      lista.push({
        fecha: `${p}-${dos(1 + Math.floor(r() * 27))}`, tarjeta: banco === "visa" ? "1234" : "5678",
        detalle: COMERCIOS[Math.floor(r() * COMERCIOS.length)], cuota: enCuotas ? `${1 + Math.floor(r() * total)}/${total}` : null,
        uyu: Math.round(300 + r() * 4200), usd: 0, banco, tipo: "consumo",
      });
    }
    if (r() < 0.7) {
      lista.push({ fecha: `${p}-${dos(1 + Math.floor(r() * 27))}`, tarjeta: null, detalle: EN_DOLARES[Math.floor(r() * EN_DOLARES.length)], cuota: null, uyu: 0, usd: cent(4 + r() * 12), banco, tipo: "consumo" });
    }
  }
  return lista.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function tarjetasDe(p: string): Tarjeta[] {
  if (indice(p) < 0) return [];
  return BANCOS.map((banco) => {
    const propios = movimientosDe(p).filter((m) => m.banco === banco);
    const montos = (mon: "uyu" | "usd") => {
      const consumo = cent(propios.reduce((s, m) => s + m[mon], 0));
      return { consumo, banco: 0, iva: 0, total: consumo };
    };
    return { banco, vencimiento: `${mover(p, 1)}-${banco === "visa" ? "08" : "12"}`, uyu: montos("uyu"), usd: montos("usd") };
  });
}

// Préstamo en UI: cuota fija en UI, y la UI sube un poco todos los meses
const CUOTA_UI = 3150, PRIMERA_CUOTA = 20, CUOTAS_TOTALES = 300;
// Sistema francés: 4,8 % anual sobre UI, la cuota de capital + interés de CUOTA_UI
const TASA = 1.048 ** (1 / 12) - 1, CUOTA_PRESTAMO = 2530;
const CAPITAL_INICIAL = (CUOTA_PRESTAMO * (1 - (1 + TASA) ** -CUOTAS_TOTALES)) / TASA;
const saldoDespuesDe = (n: number) => CAPITAL_INICIAL * (1 + TASA) ** n - (CUOTA_PRESTAMO * ((1 + TASA) ** n - 1)) / TASA;
const valorUI = (p: string) => cent(6.1 * 1.004 ** indice(p));
function creditoDe(p: string) {
  const i = indice(p);
  if (!enRango(p)) return null;
  const total = Math.round(CUOTA_UI * valorUI(p));
  return {
    mes: p, real: true, fecha: `${p}-05`, cuota: PRIMERA_CUOTA + i, total, totalUI: CUOTA_UI, uiExacta: true,
    lineas: [
      { fecha: `${p}-05`, concepto: "Cuota préstamo", detalle: `Nº ${PRIMERA_CUOTA + i}`, importe: Math.round(total * 0.97) },
      { fecha: `${p}-05`, concepto: "Seguro", detalle: "de vida", importe: total - Math.round(total * 0.97) },
    ],
  };
}

// Cuentas de la casa pagadas desde el banco. En el último mes todavía no llegó la de Antel Móvil
// (para ver cómo se muestra lo que falta).
function pagosDe(p: string): PagoCuenta[] {
  if (indice(p) < 0) return [];
  const r = azar(`pagos ${p}`);
  const invierno = ["06", "07", "08"].includes(p.slice(5));
  return [
    { cuenta: "ute", monto: Math.round((invierno ? 3500 : 2300) + r() * 700), fecha: `${p}-12` },
    { cuenta: "antelFijo", monto: 1890, fecha: `${p}-14` },
    ...(p === ultimo ? [] : [{ cuenta: "antelMovil" as const, monto: Math.round(950 + r() * 200), fecha: `${p}-16` }]),
  ];
}

const esAguinaldo = (p: string) => ["06", "12"].includes(p.slice(5));
const cobrado = (p: string) => {
  const s = sueldoDe(p);
  return s ? s.sueldo.liquido + (esAguinaldo(p) ? Math.round(s.sueldo.liquido / 2) : 0) : 0;
};

// Un mes completo ("2026-09"), o null fuera de los meses del demo
export function mesDe(p: string): Mes | null {
  const actual = sueldoDe(p);
  if (!actual) return null;
  const anterior = mover(p, -1), haceUnAnio = mover(p, -12);
  const consumos = movimientosDe(p);
  // Aguinaldo en junio y diciembre: medio sueldo, como otro cobro
  const aguinaldo = esAguinaldo(p) ? Math.round(actual.sueldo.liquido / 2) : 0;
  const ultimos12 = Array.from({ length: 12 }, (_, k) => mover(p, k - 11));
  const credito = creditoDe(p);

  const cuotas: Cuota[] = consumos
    .filter((m) => m.cuota)
    .map((m) => {
      const [n, total] = m.cuota!.split("/").map(Number);
      return { ...m, n, total, restaUyu: (total - n) * m.uyu, restaUsd: (total - n) * m.usd };
    })
    .filter((c) => c.n < c.total)
    .sort((a, b) => b.restaUyu - a.restaUyu);

  return {
    periodo: p,
    nombre: nombreMes(p),
    resumen: {
      periodo: p, cobrado: cobrado(p), tickets: 9000, guardia: actual.guardia, adelantos: 0,
      empresa: "EMPRESA DE EJEMPLO S.A.",
      otrosIngresos: esAguinaldo(p)
        ? [{ tipo: "aguinaldo", descripcion: "Liquidación de aguinaldos", nombre: "Aguinaldo", liquido: aguinaldo, bruto: Math.round(aguinaldo * 1.18), fechaPago: `${p}-15` }]
        : [],
      extras: [...(actual.vacacional ? ["Salario vacacional"] : []), ...(esAguinaldo(p) ? ["Aguinaldo"] : [])],
    },
    sueldos: [actual.sueldo, sueldoDe(anterior)?.sueldo ?? null, sueldoDe(haceUnAnio)?.sueldo ?? null],
    periodos: [p, anterior, haceUnAnio],
    tarjetas: tarjetasDe(p),
    consumos,
    cuotas,
    credito: {
      prestamo: { contrato: "000000", importeUI: 700000, fechaValor: "2020-01-05", vencimiento: "2045-01-05", vencimientoGarantia: "2030-01-05" },
      uiHoy: { fecha: `${ultimo}-01`, valor: valorUI(ultimo) },
      cuotasTotales: CUOTAS_TOTALES,
      hayDatos: true,
      mes: credito,
      historia: ultimos12.map(creditoDe).filter((h) => h !== null),
      dolarHoy: { fecha: `${ultimo}-01`, valor: 40.2 },
      cotizacionMes: credito ? { fecha: `${p}-05`, ui: valorUI(p), dolar: 40.2 } : null,
      inicio: { fecha: "2020-01-05", ui: 4.39, dolar: 37.4 },
      estimado: {
        tasaAnual: 0.048, cuotaUI: CUOTA_PRESTAMO, capitalInicialUI: CAPITAL_INICIAL, cuotasTotales: CUOTAS_TOTALES,
        saldoUI: credito ? saldoDespuesDe(credito.cuota) : null,
      },
    },
    pagos: pagosDe(p),
  };
}

// Todos los meses del demo, del más viejo al más nuevo
export const todosLosMeses = (): Mes[] =>
  Array.from({ length: MESES }, (_, k) => mesDe(mover(primero, k))).filter((m) => m !== null);

// Los dos alquileres de /configuracion: uno desde el principio y un aumento a mitad de camino
export const CONFIG_DEMO: Config = {
  cobras: [{ desde: primero, monto: 22000 }, { desde: mover(primero, 18), monto: 24500 }],
  pagas: [{ desde: primero, monto: 19000 }, { desde: mover(primero, 12), monto: 21000 }],
};
