// Tipos de los datos de un mes (los arma el pipeline del proyecto original) y su lectura.
//
// En el demo no hay base de datos ni sesión: los meses salen de lib/datos-demo.ts, inventados.

import "server-only";
import { CONFIG_DEMO, mesDe, todosLosMeses } from "./datos-demo";

export type Banco = "visa" | "master";
export type Montos = { consumo: number; banco: number; iva: number; total: number };

export type Movimiento = {
  fecha: string;
  tarjeta: string | null;
  detalle: string;
  cuota: string | null;
  uyu: number;
  usd: number;
  banco: Banco;
  tipo: "consumo" | "banco" | "iva" | "pago";
};

export type Cuota = Movimiento & { n: number; total: number; restaUyu: number; restaUsd: number };

export type Sueldo = {
  liquido: number;
  bruto: number;
  cobertura: number;
  descuentos: Record<string, number>;
  totalDescuentos: number;
  // Lo que se cobra en plata, renglón por renglón (suma el bruto), y si el mes tuvo días de licencia.
  // Meses cargados antes no lo tienen.
  haberes?: { concepto: string; importe: number }[];
  licencia?: boolean;
};

// Un recibo aparte del de sueldo (aguinaldo, retroactivo). nombre, bruto, fechaPago y adelanto: meses cargados antes no los tienen.
// liquido: lo cobrado (con lo que llegó antes como adelanto, si el recibo lo descuenta: adelanto)
export type Recibo = { tipo: string; descripcion: string | null; liquido: number; nombre?: string; bruto?: number; fechaPago?: string | null; adelanto?: number };

export type Tarjeta = { banco: Banco; vencimiento: string | null; uyu: Montos; usd: Montos };

// nombre: "Interés", "Capital", "Seguro de vida"… (lo pone el pipeline; meses viejos no lo tienen)
export type LineaCredito = { fecha: string; concepto: string; detalle: string; nombre?: string; importe: number };

export type CreditoMes = {
  mes: string;
  real: boolean;
  fecha: string;
  cuota: number | null;
  total: number;
  totalUI: number;
  uiExacta: boolean;
  lineas: LineaCredito[];
};

export type Prestamo = {
  contrato: string;
  importeUI: number;
  fechaValor: string | null;
  vencimiento: string | null;
  vencimientoGarantia: string | null;
  // Del contrato, si el pipeline los tiene (meses cargados antes no los tienen)
  primerVencimiento?: string | null;
};

export type Cotizacion = { fecha: string; ui: number | null; dolar: number | null };

// Cuentas de la casa pagadas desde el banco (los manda el pipeline; meses viejos no los tienen)
export type Cuenta = "ute" | "antelFijo" | "antelMovil";
// origen "factura": cargada a mano desde el PDF, y la fecha es la del vencimiento (no hubo mail)
export type PagoCuenta = { cuenta: Cuenta; monto: number; fecha: string; origen?: "factura" };

// Montos fijos de /configuracion: cada uno vale desde su mes ("AAAA-MM") hasta el siguiente
export type ValorFijo = { desde: string; monto: number };
export type Config = { cobras: ValorFijo[]; pagas: ValorFijo[] };

// El préstamo: del contrato (contrato: true, exacto) o estimado con los débitos reales
export type PrestamoEstimado = {
  contrato?: boolean;
  tasaAnual: number; // efectiva
  cuotaUI: number; // con contrato, incluye el seguro de vida
  capitalInicialUI: number;
  cuotasTotales: number;
  saldoUI: number | null; // después de la cuota de ese mes
  // Solo con contrato
  primeraCuotaUI?: number;
  primeraCuotaCapitalUI?: number;
  seguroVida?: number;
};

export type Mes = {
  periodo: string;
  nombre: string;
  resumen: {
    periodo: string;
    cobrado: number;
    tickets: number;
    guardia: boolean;
    adelantos: number;
    empresa: string | null;
    otrosIngresos: Recibo[];
    // Lo que el mes tuvo además del sueldo de siempre ("Aguinaldo", "Salario vacacional")
    extras?: string[];
  };
  sueldos: [Sueldo | null, Sueldo | null, Sueldo | null];
  periodos: [string, string, string];
  tarjetas: Tarjeta[];
  consumos: Movimiento[];
  cuotas: Cuota[];
  credito: {
    prestamo: Prestamo | null;
    uiHoy: { fecha: string; valor: number } | null;
    cuotasTotales: number | null;
    hayDatos: boolean;
    mes: CreditoMes | null;
    historia: CreditoMes[];
    // Estimado con los débitos reales (cuota fija en UI): no está en meses cargados antes de que existiera
    estimado?: PrestamoEstimado | null;
    // Dólar del BCU de hoy, y la UI y el dólar del día del préstamo (para mostrar montos en dólares)
    dolarHoy?: { fecha: string; valor: number } | null;
    inicio?: Cotizacion | null;
    // UI y dólar del día del débito de este mes
    cotizacionMes?: Cotizacion | null;
  };
  pagos?: PagoCuenta[];
};

export type PuntoSerie = {
  periodo: string;
  nombre: string;
  cobrado: number;
  tickets: number;
  guardia: boolean;
  sueldo: boolean;
  extras: string[];
  tarjetas: { banco: Banco; uyu: number; usd: number }[];
  credito: { total: number; real: boolean; cuota: number | null } | null;
  // UI y dólar del día del débito (para comparar la UI con el dólar en /prestamo)
  cotizacion: Cotizacion | null;
  pagos: PagoCuenta[];
};

// Un punto por mes para los gráficos y el menú, del más viejo al más nuevo
export async function leerSerie(): Promise<PuntoSerie[]> {
  return todosLosMeses().map((m) => ({
    periodo: m.periodo,
    nombre: m.nombre,
    cobrado: m.resumen.cobrado,
    tickets: m.resumen.tickets,
    guardia: m.resumen.guardia,
    sueldo: m.sueldos[0] !== null,
    extras: m.resumen.extras ?? [],
    tarjetas: m.tarjetas.map((t) => ({ banco: t.banco, uyu: t.uyu.total, usd: t.usd.total })),
    credito: m.credito.mes && { total: m.credito.mes.total, real: m.credito.mes.real, cuota: m.credito.mes.cuota },
    cotizacion: m.credito.cotizacionMes ?? null,
    pagos: m.pagos ?? [],
  }));
}

// El detalle completo de un mes ("2026-09"), o null si no es uno de los meses del demo
export async function leerMes(periodo: string): Promise<Mes | null> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) return null;
  return mesDe(periodo);
}

// Los montos fijos de /configuracion (los dos alquileres), del más viejo al más nuevo
export async function leerConfig(): Promise<Config> {
  return CONFIG_DEMO;
}
