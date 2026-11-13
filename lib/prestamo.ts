// Cuadro de cuotas del préstamo, con la misma cuenta que usa el pipeline del proyecto original.
// - Con el contrato (contrato: true): como el Anexo I del banco. Cada cuota paga el interés del
//   saldo (tasa nominal / 12), el seguro de vida sobre el saldo y el resto es capital; cada parte se
//   corta en centésimos; la primera trae su capital del Anexo y la última paga todo el saldo.
// - Estimado: sistema francés sin seguro, con la tasa estimada.
// Sin datos de nadie: solo cuentas sobre el préstamo del modelo.

import type { PrestamoEstimado } from "./modelo";

export type FilaCuota = { n: number; saldo: number; interes: number; capital: number; seguro: number };

const centesimos = (x: number) => Math.floor(x * 100 + 1e-9) / 100;

export function amortizacion(e: PrestamoEstimado): FilaCuota[] {
  const filas: FilaCuota[] = [];
  let saldo = e.capitalInicialUI;
  if (e.contrato && e.primeraCuotaUI != null && e.primeraCuotaCapitalUI != null) {
    // Tasa nominal mensual, a partir de la efectiva anual
    const r = (1 + e.tasaAnual) ** (1 / 12) - 1;
    const seguroVida = e.seguroVida ?? 0;
    for (let n = 1; n <= e.cuotasTotales && saldo > 0.005; n++) {
      const seguro = centesimos(saldo * seguroVida);
      const ultima = n === e.cuotasTotales;
      const capital = n === 1 ? e.primeraCuotaCapitalUI : ultima ? centesimos(saldo + 0.001) : centesimos(e.cuotaUI - seguro - centesimos(saldo * r));
      const interes =
        n === 1 ? centesimos(e.primeraCuotaUI - seguro - capital + 0.001) : ultima ? centesimos(e.cuotaUI - seguro - capital + 0.001) : centesimos(saldo * r);
      saldo = ultima ? 0 : centesimos(saldo - capital + 0.001);
      filas.push({ n, saldo, interes, capital, seguro });
    }
    return filas;
  }
  const r = (1 + e.tasaAnual) ** (1 / 12) - 1;
  for (let n = 1; n <= e.cuotasTotales && saldo > 0; n++) {
    const interes = saldo * r;
    const capital = Math.min(e.cuotaUI - interes, saldo);
    saldo = Math.max(0, saldo - capital);
    filas.push({ n, saldo, interes, capital, seguro: 0 });
  }
  return filas;
}

// "2026-10" + 3 -> "2027-01"
export function sumarMeses(periodo: string, k: number) {
  const i = Number(periodo.slice(0, 4)) * 12 + Number(periodo.slice(5, 7)) - 1 + k;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}
