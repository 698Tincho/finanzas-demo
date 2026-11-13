// Las fichas de "qué llegó": una por cada dato del que depende "Te quedó" (recibo, estado de cada
// tarjeta, débito del préstamo y cada cuenta de la casa que se espera), con su estado. Contestan
// por qué "Te quedó" está en "—" sin tener que leer la nota.
//
// El color va en el ícono y es el del dato (Visa azul, préstamo violeta…). El estado no se pinta;
// lo que falta va con borde punteado, como lo rayado de las barras.
//
// Las arma el tablero (components/tablero.tsx, en el Resumen y en el reporte del mes) y /cuentas.

import type { ReactNode } from "react";
import type { Banco, Cuenta, Mes, PagoCuenta, PuntoSerie } from "@/lib/modelo";
import { BANCO, diaMes, dolares, pesos } from "@/lib/formato";
import { IconoCalendario, IconoBanco, IconoCelular, IconoInternet, IconoLuz, IconoRecibo, IconoTarjeta, IconoTilde } from "./iconos";
import { COLORES } from "./reparto";
import { CUENTAS, cuentasFaltantes, faltaCreditoEn, mesSolo } from "./resumen";
import { Estado, Ficha } from "./ui";

const ICONO_CUENTA: Record<Cuenta, (p: { color?: string }) => ReactNode> = { ute: IconoLuz, antelFijo: IconoInternet, antelMovil: IconoCelular };

export const Fecha = ({ children }: { children: ReactNode }) => (
  <>
    <IconoCalendario />
    {children}
  </>
);
// Lo que llegó lleva solo un tilde (el texto, para lectores de pantalla): lo único que se lee de
// lejos es lo que falta
export const Llego = ({ children }: { children: string }) => (
  <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-borde text-suave" title={children}>
    <IconoTilde className="size-3" />
    <span className="sr-only">{children}</span>
  </span>
);
export const Falta = () => <Estado falta>Falta</Estado>;

// conTicket: el ticket va en el pie (en el tablero tiene su propia ficha). La cifra es lo del recibo
// de sueldo; los recibos aparte (aguinaldo, retroactivos) tienen su ficha (fichasOtrosRecibos).
export function fichaSueldo(mes: Mes, { conTicket = true } = {}): ReactNode {
  const sueldo = mes.sueldos[0];
  const otros = mes.resumen.otrosIngresos;
  const delSueldo = mes.resumen.cobrado - otros.reduce((t, r) => t + r.liquido, 0);
  // Los extras que vienen dentro del recibo de sueldo (los de recibos aparte tienen su ficha)
  const aparte = new Set(otros.map((r) => r.nombre ?? r.tipo));
  const incluye = (mes.resumen.extras ?? []).filter((x) => !aparte.has(x)).map((x) => x.toLowerCase());
  return (
    <Ficha
      key="sueldo"
      icono={<IconoRecibo />}
      titulo="Sueldo"
      estado={sueldo ? <Llego>Llegó</Llego> : <Falta />}
      falta={!sueldo}
      valor={sueldo ? pesos(delSueldo) : "—"}
      detalle={sueldo && incluye.length ? `incluye ${incluye.length > 1 ? `${incluye.slice(0, -1).join(", ")} y ${incluye.at(-1)}` : incluye[0]}` : undefined}
      pie={
        sueldo
          ? { izquierda: "líquido en pesos", derecha: conTicket && mes.resumen.tickets > 0 ? `+ ${pesos(mes.resumen.tickets)} ticket` : undefined }
          : { izquierda: "todavía no está el recibo" }
      }
    />
  );
}

// Una ficha por cada recibo aparte del de sueldo (aguinaldo, retroactivos), con su líquido
export function fichasOtrosRecibos(mes: Mes): ReactNode[] {
  return mes.resumen.otrosIngresos.map((r, i) => (
    <Ficha
      key={`otro-${r.tipo}-${i}`}
      icono={<IconoRecibo />}
      titulo={r.nombre ?? r.descripcion ?? r.tipo}
      estado={<Llego>Llegó</Llego>}
      valor={pesos(r.liquido)}
      pie={{
        izquierda: r.adelanto ? "cobrado como adelanto" : r.fechaPago ? <Fecha>cobrado el {diaMes(r.fechaPago)}</Fecha> : "líquido",
        derecha: "recibo aparte",
      }}
    />
  ));
}

export function fichasTarjetas(mes: Mes): ReactNode[] {
  return (Object.keys(BANCO) as Banco[]).map((b) => {
    const t = mes.tarjetas.find((x) => x.banco === b);
    return (
      <Ficha
        key={b}
        icono={<IconoTarjeta color={COLORES[b]} />}
        titulo={BANCO[b]}
        estado={t ? <Llego>Llegó</Llego> : <Falta />}
        falta={!t}
        valor={t ? pesos(t.uyu.total) : "—"}
        pie={
          t
            ? { izquierda: t.vencimiento ? <Fecha>vence {diaMes(t.vencimiento)}</Fecha> : "estado de cuenta", derecha: t.usd.total ? `+ ${dolares(t.usd.total)}` : undefined }
            : { izquierda: "todavía no está el estado" }
        }
      />
    );
  });
}

// El préstamo del mes, o nada si ese mes no corresponde (antes de la primera cuota)
export function fichaCredito(mes: Mes): ReactNode | null {
  const h = mes.credito.mes;
  if (!h && !faltaCreditoEn(mes)) return null;
  return (
    <Ficha
      key="credito"
      icono={<IconoBanco color={COLORES.credito} />}
      titulo="Préstamo"
      estado={h ? h.real ? <Llego>Debitada</Llego> : <Estado>Estimada</Estado> : <Falta />}
      falta={!h}
      valor={h ? `${h.real ? "" : "≈ "}${pesos(h.total)}` : "—"}
      pie={
        h
          ? { izquierda: <Fecha>{h.real ? "débito" : "se debita el"} {diaMes(h.fecha)}</Fecha>, derecha: h.cuota ? `cuota ${h.cuota}` : undefined }
          : { izquierda: "todavía no está el débito" }
      }
    />
  );
}

// Las fichas de las cuentas de la casa de un mes: una por cuenta pagada, y una por cada cuenta que
// se espera y no llegó
export function fichasCuentas(periodo: string, pagos: PagoCuenta[], serie: PuntoSerie[]): ReactNode[] {
  const faltan = cuentasFaltantes(serie, periodo);
  const i = serie.findIndex((p) => p.periodo === periodo);
  // El último mes antes de este en que se pagó una cuenta (para decir por qué se la espera)
  const ultimoPago = (k: Cuenta) => serie.slice(0, Math.max(0, i)).findLast((p) => p.pagos.some((x) => x.cuenta === k));
  return (Object.keys(CUENTAS) as Cuenta[]).flatMap((k) => {
    const p = pagos.find((x) => x.cuenta === k);
    const Icono = ICONO_CUENTA[k];
    if (p) {
      return [
        <Ficha
          key={k}
          icono={<Icono color={COLORES.cuentas} />}
          titulo={CUENTAS[k]}
          estado={<Llego>Pagada</Llego>}
          valor={pesos(p.monto)}
          pie={{ izquierda: <Fecha>{p.origen === "factura" ? "vence" : "pagada el"} {diaMes(p.fecha)}</Fecha>, derecha: p.origen === "factura" ? "factura" : "banco" }}
        />,
      ];
    }
    if (!faltan.includes(k)) return [];
    const antes = ultimoPago(k);
    return [
      <Ficha
        key={k}
        icono={<Icono color={COLORES.cuentas} />}
        titulo={CUENTAS[k]}
        estado={<Falta />}
        falta
        valor="—"
        pie={{ izquierda: antes ? `la pagaste en ${mesSolo(antes.nombre)}` : "todavía no llegó el pago" }}
      />,
    ];
  });
}

// Cuántos datos del mes faltan para saber cuánto te quedó
export function cuantosFaltan(mes: Mes, serie: PuntoSerie[]) {
  return (
    Number(!mes.sueldos[0]) +
    Object.keys(BANCO).filter((b) => !mes.tarjetas.some((t) => t.banco === b)).length +
    Number(faltaCreditoEn(mes)) +
    cuentasFaltantes(serie, mes.periodo).length
  );
}
