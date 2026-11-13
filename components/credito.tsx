// Piezas de /prestamo: los datos fijos del préstamo (tres recuadros: saldo, condiciones, garantía)
// y la lista de todos los débitos agrupada por año.

import Link from "next/link";
import type { ReactNode } from "react";
import type { CreditoMes, Mes, PuntoSerie } from "@/lib/modelo";
import { fechaLarga, enUI, pct, pesos } from "@/lib/formato";
import { nombreCorto } from "./detalle";
import { Chevron, Nota } from "./ui";

export function DatosPrestamo({ credito, h }: { credito: Mes["credito"]; h: CreditoMes }) {
  const { prestamo, uiHoy, cuotasTotales, estimado } = credito;
  const exacto = Boolean(estimado?.contrato);
  if (!prestamo) return <Nota>Faltan los datos del préstamo.</Nota>;
  // Un monto en UI y, debajo, cuánto es hoy en pesos
  const conHoy = (ui: number, fuerte = false) => (
    <>
      <span className={fuerte ? "font-bold" : ""}>{enUI(ui)}</span>
      {uiHoy && <div className="text-xs text-suave">hoy ≈ {pesos(ui * uiHoy.valor)}</div>}
    </>
  );

  return (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      {estimado && (
        <Recuadro titulo="Saldo">
          {dato("Préstamo", conHoy(estimado.capitalInicialUI))}
          {estimado.saldoUI != null && dato(`Saldo tras cuota ${h.cuota}`, conHoy(estimado.saldoUI, true))}
          {estimado.saldoUI != null && dato("Capital pagado", pct(1 - estimado.saldoUI / estimado.capitalInicialUI))}
        </Recuadro>
      )}
      <Recuadro titulo="Condiciones">
        {estimado && dato(exacto ? "Cuota fija (con seguro)" : "Cuota fija", enUI(estimado.cuotaUI))}
        {estimado && dato(exacto ? "Tasa" : "Tasa (estimada)", `${new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2 }).format(estimado.tasaAnual * 100)} % ${exacto ? "efectiva" : "anual"}`)}
        {exacto && estimado?.seguroVida ? dato("Seguro de vida", `${pct(estimado.seguroVida)} del saldo por mes`) : null}
        {cuotasTotales && dato("Cuotas", `${cuotasTotales} mensuales`)}
        {prestamo.fechaValor && dato(exacto ? "Firmado" : "Fecha valor", fechaLarga(prestamo.fechaValor))}
        {prestamo.primerVencimiento && dato("Primera cuota", fechaLarga(prestamo.primerVencimiento))}
        {prestamo.vencimiento && dato(exacto ? "Última cuota" : "Vencimiento", fechaLarga(prestamo.vencimiento))}
        {!estimado && dato("Moneda", "Unidades Indexadas")}
      </Recuadro>
      <Recuadro titulo="Garantía">
        {dato("Préstamo registrado", conHoy(prestamo.importeUI))}
        {prestamo.vencimientoGarantia && dato("Vence", fechaLarga(prestamo.vencimientoGarantia))}
        <p className="py-1 text-xs text-suave">Es el monto de la garantía, no lo que se debe.</p>
        {prestamo.contrato && <div className="mt-1 border-t border-borde pt-1">{dato("Contrato", prestamo.contrato)}</div>}
      </Recuadro>
    </div>
  );
}

function Recuadro({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="superficie p-4 text-sm">
      <h3 className="mb-1 text-xs font-semibold text-suave">{titulo}</h3>
      <dl>{children}</dl>
    </div>
  );
}

const dato = (nombre: string, valor: ReactNode) => (
  <div key={nombre} className="flex items-baseline justify-between gap-3 py-1">
    <dt className="text-suave">{nombre}</dt>
    <dd className="num">{valor}</dd>
  </div>
);

// Todos los débitos, por año: cada año es una fila que se abre (solo el más nuevo, abierto) con
// promedio y total; adentro, un renglón por mes que lleva a ese reporte
export function ListaDebitos({ debitos }: { debitos: PuntoSerie[] }) {
  const porAnio = new Map<string, PuntoSerie[]>();
  for (const p of [...debitos].reverse()) {
    const anio = p.periodo.slice(0, 4);
    porAnio.set(anio, [...(porAnio.get(anio) ?? []), p]);
  }
  const columnas = "grid grid-cols-[1fr_5.5rem_6rem] items-baseline gap-x-3";
  const aprox = (meses: PuntoSerie[]) => (meses.some((p) => !p.credito!.real) ? "≈ " : "");

  return (
    <div className="mt-3 text-sm">
      <div className={`${columnas} border-b-2 border-borde pb-1.5 pl-6 text-xs font-semibold text-suave`}>
        <span>Año</span>
        <span className="text-right">Promedio</span>
        <span className="text-right">Total</span>
      </div>
      {[...porAnio].map(([anio, meses], i) => {
        const total = meses.reduce((s, p) => s + p.credito!.total, 0);
        return (
          <details key={anio} open={i === 0} className="group border-b border-borde">
            <summary className={`${columnas} cursor-pointer list-none py-2 select-none [&::-webkit-details-marker]:hidden`}>
              <span>
                <span className="inline-flex w-6 align-middle">
                  <Chevron className="text-suave transition-transform group-open:rotate-90" />
                </span>
                <b>{anio}</b>
                <span className="text-suave"> · {meses.length} {meses.length === 1 ? "débito" : "débitos"}</span>
              </span>
              <span className="num">{aprox(meses)}{pesos(total / meses.length)}</span>
              <span className="num font-bold">{aprox(meses)}{pesos(total)}</span>
            </summary>
            <ul className="pb-1">
              {meses.map((p) => (
                <li key={p.periodo}>
                  <Link href={`/mes/${p.periodo}`} className="flex items-baseline justify-between gap-3 border-t border-borde py-1.5 pl-6 hover:bg-tarjeta">
                    <span>
                      {nombreCorto(p.periodo).split(" ")[0]}
                      <span className="text-suave">
                        {p.credito!.cuota ? ` · cuota ${p.credito!.cuota}` : ""}
                        {!p.credito!.real && " · estimado"}
                      </span>
                    </span>
                    <span className="num">{p.credito!.real ? "" : "≈ "}{pesos(p.credito!.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
