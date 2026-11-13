// Resumen de un mes: el ingreso total (sueldo en pesos + ticket + el alquiler que cobrás), lo que
// te quedó y a dónde fue el resto (cada tarjeta, el préstamo, el alquiler que pagás y las cuentas
// de la casa). El detalle de cada parte está en las secciones de abajo.

import type { Config, Cuenta, Mes, PagoCuenta, PuntoSerie, ValorFijo } from "@/lib/modelo";
import { BANCO, diaMes, dolares, pesos, variacion } from "@/lib/formato";
import { IconoEntra, IconoSale, IconoTilde } from "./iconos";
import { MicroBarras } from "./micro-barras";
import { COLORES, type Parte } from "./reparto";
import { Ficha, MarcaGuardia, PuntoColor, Variacion } from "./ui";

// "20 %": en la leyenda alcanza con el porcentaje entero
export const pctEntero = (x: number) => `${Math.round(x * 100)} %`;
// "Agosto 2026" -> "agosto"
export const mesSolo = (nombre: string) => nombre.split(" ")[0].toLowerCase();

export const CUENTAS: Record<Cuenta, string> = { ute: "UTE", antelFijo: "Antel fijo", antelMovil: "Antel Móvil" };

// El monto fijo de un mes: el último cambio desde ese mes o antes. Sin ninguno, 0 (no hay alquiler).
export function valorEn(lista: ValorFijo[], periodo: string) {
  return lista.filter((v) => v.desde <= periodo).sort((a, b) => a.desde.localeCompare(b.desde)).at(-1)?.monto ?? 0;
}
export const totalCuentas = (pagos: PagoCuenta[]) => pagos.reduce((s, p) => s + p.monto, 0);

// Una cuenta de la casa se espera si se pagó en alguno de los dos meses anteriores: si este mes no
// llegó el pago, falta (y no se sabe cuánto quedó). Una cuenta que nunca se pagó no falta.
export function cuentasFaltantes(serie: PuntoSerie[], periodo: string): Cuenta[] {
  const i = serie.findIndex((p) => p.periodo === periodo);
  if (i < 0) return [];
  const antes = serie.slice(Math.max(0, i - 2), i);
  return (Object.keys(CUENTAS) as Cuenta[]).filter(
    (k) => antes.some((p) => p.pagos.some((x) => x.cuenta === k)) && !serie[i].pagos.some((x) => x.cuenta === k),
  );
}

// Qué le falta a un mes de la serie para saber cuánto quedó ("el recibo de sueldo", "el estado de
// Mastercard", "el pago de Antel Móvil"). Vacío: el mes está completo. Lo usan "Mes a mes" y el menú.
export function faltanEnMes(p: PuntoSerie, serie: PuntoSerie[]): string[] {
  const bancos = Object.keys(BANCO).filter((b) => !p.tarjetas.some((t) => t.banco === b));
  const cuentas = cuentasFaltantes(serie, p.periodo);
  return [
    !p.sueldo && "el recibo de sueldo",
    bancos.length > 0 && `el estado de ${bancos.map((b) => BANCO[b]).join(" y ")}`,
    cuentas.length > 0 && `el pago de ${cuentas.map((k) => CUENTAS[k]).join(" y ")}`,
  ].filter((x): x is string => Boolean(x));
}

// Lo que hace falta para calcular un mes de la serie: todos los meses (para saber qué cuentas se
// esperan) y los montos de /configuracion
export type Contexto = { serie: PuntoSerie[]; config: Config };

// Ingreso de un mes de la serie, solo con recibo: sueldo en pesos + ticket + alquiler que cobrás.
// Te quedó = ingreso − tarjetas en pesos − préstamo − alquiler que pagás − cuentas de la casa, y
// solo con los estados de todas las tarjetas y las cuentas que se esperan.
export const ingresoEnMes = (p: PuntoSerie | undefined, config: Config) =>
  p?.sueldo ? p.cobrado + p.tickets + valorEn(config.cobras, p.periodo) : null;
export function quedoEnMes(p: PuntoSerie | undefined, { serie, config }: Contexto) {
  const ingreso = ingresoEnMes(p, config);
  if (ingreso == null || p!.tarjetas.length < Object.keys(BANCO).length || cuentasFaltantes(serie, p!.periodo).length) return null;
  return (
    ingreso -
    p!.tarjetas.reduce((s, t) => s + t.uyu, 0) -
    (p!.credito?.total ?? 0) -
    valorEn(config.pagas, p!.periodo) -
    totalCuentas(p!.pagos)
  );
}

// Lo normal antes de un mes: el promedio de los 12 meses anteriores con todos los datos (recibo,
// estados y cuentas). El préstamo, sobre los que tienen débito.
export function loNormal(periodo: string, ctx: Contexto) {
  const i = ctx.serie.findIndex((p) => p.periodo === periodo);
  const completos = ctx.serie.slice(Math.max(0, i - 12), Math.max(0, i)).filter((p) => quedoEnMes(p, ctx) != null);
  if (!completos.length) return null;
  const prom = (l: number[]) => (l.length ? l.reduce((s, x) => s + x, 0) / l.length : null);
  const banco = (b: string) => prom(completos.map((p) => p.tarjetas.find((t) => t.banco === b)?.uyu ?? 0));
  return {
    n: completos.length,
    visa: banco("visa"),
    master: banco("master"),
    credito: prom(completos.filter((p) => p.credito).map((p) => p.credito!.total)),
    pagas: prom(completos.map((p) => valorEn(ctx.config.pagas, p.periodo))),
    cuentas: prom(completos.map((p) => totalCuentas(p.pagos))),
    queda: prom(completos.map((p) => quedoEnMes(p, ctx)!)),
  };
}

// El préstamo solo falta desde la primera cuota (o, sin ese dato, desde que existe el préstamo)
export function faltaCreditoEn({ credito, periodo }: Mes) {
  const desde = (credito.prestamo?.primerVencimiento ?? credito.prestamo?.fechaValor)?.slice(0, 7);
  return !credito.mes && credito.hayDatos && (!desde || periodo >= desde);
}

export function ResumenMes({ mes, anterior, serie, config }: { mes: Mes; anterior?: PuntoSerie; serie: PuntoSerie[]; config: Config }) {
  const { resumen, tarjetas, credito } = mes;
  const h = credito.mes;
  // Faltante no es cero: sin ningún recibo del mes se muestra "—" y qué falta, nunca $ 0
  const conSueldo = mes.sueldos[0] !== null;
  const hayRecibos = conSueldo || resumen.otrosIngresos.length > 0 || resumen.cobrado > 0 || resumen.tickets > 0;
  const alquilerCobrado = valorEn(config.cobras, mes.periodo);
  const alquilerPagado = valorEn(config.pagas, mes.periodo);
  const pagos = mes.pagos ?? [];
  const faltanCuentas = cuentasFaltantes(serie, mes.periodo);
  const ingreso = hayRecibos ? resumen.cobrado + resumen.tickets + alquilerCobrado : null;
  const faltaCredito = faltaCreditoEn(mes);
  const faltan = Object.keys(BANCO).filter((b) => !tarjetas.some((t) => t.banco === b));

  const falta = [
    !conSueldo && "el recibo de sueldo",
    faltan.length > 0 && `el estado de ${faltan.map((b) => BANCO[b]).join(" y ")}`,
    faltaCredito && "el débito del préstamo",
    faltanCuentas.length > 0 && `el pago de ${y(faltanCuentas.map((k) => CUENTAS[k]))}`,
  ].filter(Boolean) as string[];
  const gastos = tarjetas.reduce((s, t) => s + t.uyu.total, 0) + (h?.total ?? 0) + alquilerPagado + totalCuentas(pagos);
  const quedo = falta.length || ingreso == null ? null : ingreso - gastos;
  const aprox = h && !h.real ? "≈ " : "";
  const ingresoAntes = ingresoEnMes(anterior, config);
  const normal = loNormal(mes.periodo, { serie, config });
  const deIngreso = (monto: number | null) => (monto != null && ingreso ? pctEntero(monto / ingreso) : null);

  const tarjeta = (banco: string) => {
    const t = tarjetas.find((x) => x.banco === banco);
    return {
      nombre: `Tarjeta ${BANCO[banco]}`,
      monto: t ? t.uyu.total : null,
      color: COLORES[banco as "visa" | "master"],
      detalle: t
        ? [deIngreso(t.uyu.total), t.usd.total ? `+ ${dolares(t.usd.total)}` : null, t.vencimiento && `vence ${diaMes(t.vencimiento)}`]
            .filter(Boolean)
            .join(" · ")
        : "falta el estado de cuenta",
    };
  };
  const partes = [
    tarjeta("visa"),
    tarjeta("master"),
    {
      nombre: "Préstamo",
      monto: h ? h.total : null,
      color: COLORES.credito,
      detalle: h
        ? [deIngreso(h.total), h.cuota && `cuota ${h.cuota}${credito.cuotasTotales ? ` de ${credito.cuotasTotales}` : ""}`, !h.real && "estimada"]
            .filter(Boolean)
            .join(" · ")
        : faltaCredito
          ? "todavía no está el débito"
          : "sin débito este mes",
    },
    // El alquiler, desde el primer monto cargado en /configuracion; las cuentas, si hubo pagos o falta alguno
    ...(config.pagas.some((v) => v.desde <= mes.periodo)
      ? [{ nombre: "Alquiler", monto: alquilerPagado, color: COLORES.alquiler, detalle: [deIngreso(alquilerPagado), "de Configuración"].filter(Boolean).join(" · ") }]
      : []),
    ...(pagos.length || faltanCuentas.length
      ? [
          {
            nombre: "Cuentas de la casa",
            monto: pagos.length ? totalCuentas(pagos) : null,
            color: COLORES.cuentas,
            detalle: [
              ...pagos.map((p) => `${CUENTAS[p.cuenta]} ${pesos(p.monto)}`),
              faltanCuentas.length ? `falta ${y(faltanCuentas.map((k) => CUENTAS[k]))}` : null,
            ]
              .filter(Boolean)
              .join(" · "),
          },
        ]
      : []),
    { nombre: "Te quedó", monto: quedo, color: COLORES.queda, detalle: quedo != null ? `${deIngreso(quedo)} del ingreso` : undefined },
  ];

  // Los 12 meses hasta este, para las barras chicas de los recuadros
  const iMes = serie.findIndex((p) => p.periodo === mes.periodo);
  const doce = serie.slice(Math.max(0, iMes - 11), iMes + 1);
  // Lo gastado se sabe si llegaron todas sus partes: los estados, el préstamo y todas las cuentas que
  // se esperan (una cuenta que falta deja el total de cuentas incompleto). El recibo no hace falta.
  const faltaGasto = faltan.length > 0 || faltaCredito || faltanCuentas.length > 0;
  const gastoNormal = normal
    ? [normal.visa, normal.master, normal.credito, normal.pagas, normal.cuentas].reduce<number>((s, x) => s + (x ?? 0), 0)
    : null;

  return (
    <section aria-label="Resumen del mes">
      {/* Arriba, tres recuadros como los del Resumen: ingreso, lo que te quedó y lo que gastaste,
          cada uno con las barras de los 12 meses hasta este (este mes lleno) */}
      <div className="mt-6 grid gap-2 md:grid-cols-3">
        <Ficha
          icono={<IconoEntra />}
          titulo="Ingreso total del mes"
          valor={ingreso == null ? "—" : pesos(ingreso)}
          detalle={
            ingreso == null ? (
              "Todavía no está el recibo de sueldo de este mes."
            ) : ingresoAntes != null && anterior ? (
              <>
                <Variacion valor={variacion(ingreso, ingresoAntes)} subirEsBueno semaforo /> vs. {mesSolo(anterior.nombre)}
              </>
            ) : undefined
          }
          pie={{ izquierda: `sueldo + ticket${alquilerCobrado ? " + alquiler" : ""}` }}
        >
          <MicroBarras valores={doce.map((p) => ingresoEnMes(p, config))} color="var(--texto)" etiqueta="Ingreso de los 12 meses hasta este; los números están en el reporte de cada mes" />
        </Ficha>

        <Ficha
          tono="queda"
          icono={<IconoTilde />}
          titulo="Te quedó"
          valor={<span className={quedo != null && quedo < 0 ? "text-peor" : ""}>{quedo == null ? "—" : `${aprox}${pesos(quedo)}`}</span>}
          detalle={
            quedo == null ? (
              `Falta ${y(falta.length ? falta : ["el recibo de sueldo"])} para saber cuánto te quedó.`
            ) : (
              <>
                {deIngreso(quedo)} del ingreso
                {normal?.queda != null && (
                  <>
                    {" · "}
                    <Variacion valor={variacion(quedo, normal.queda)} subirEsBueno semaforo /> vs. lo normal
                  </>
                )}
              </>
            )
          }
          pie={{ izquierda: "ingreso − gastos" }}
        >
          <MicroBarras valores={doce.map((p) => quedoEnMes(p, { serie, config }))} color="var(--serie-cobrado)" etiqueta="Lo que te quedó en los 12 meses hasta este; sin barra, un mes sin todos los datos" />
        </Ficha>

        <Ficha
          icono={<IconoSale />}
          titulo="Gastaste"
          valor={faltaGasto ? "—" : `${aprox}${pesos(gastos)}`}
          detalle={
            faltaGasto ? (
              `Falta ${y(falta.filter((f) => f !== "el recibo de sueldo"))}.`
            ) : (
              <>
                {ingreso ? `${deIngreso(gastos)} del ingreso` : null}
                {gastoNormal != null && (
                  <>
                    {ingreso ? " · " : ""}
                    <Variacion valor={variacion(gastos, gastoNormal)} subirEsBueno={false} /> vs. lo normal
                  </>
                )}
              </>
            )
          }
          pie={{ izquierda: faltaGasto ? "lo rayado todavía no se sabe" : ingreso ? "lo vacío de la barra es lo que te quedó" : undefined }}
        >
          <BarraGasto partes={partes.slice(0, -1)} base={Math.max(ingreso ?? 0, gastos)} faltaGasto={faltaGasto} />
        </Ficha>
      </div>
      {resumen.guardia && (
        <p className="mt-2 text-xs">
          <MarcaGuardia />
        </p>
      )}

      <h2 className="mt-9 mb-2 text-xl font-bold">A dónde fue</h2>
      <ContraLoNormal
        filas={partes.map((p) => {
          // Lo normal de cada parte, y si el monto es estimado (el préstamo, y lo que quedó por él)
          const clave = { "Tarjeta Visa": "visa", "Tarjeta Mastercard": "master", Préstamo: "credito", Alquiler: "pagas", "Cuentas de la casa": "cuentas", "Te quedó": "queda" }[p.nombre] as
            | "visa" | "master" | "credito" | "pagas" | "cuentas" | "queda";
          return { ...p, normal: normal?.[clave] ?? null, subirEsBueno: clave === "queda", aprox: (clave === "credito" || clave === "queda") && Boolean(aprox) };
        })}
      />
      <p className="mt-2 text-xs text-suave">
        {normal
          ? `La rayita es lo normal: el promedio de los ${normal.n === 1 ? "último mes" : `${normal.n} meses anteriores`} con todos los datos. `
          : "Todavía no hay meses anteriores completos para comparar. "}
        {tarjetas.some((t) => t.usd.total) && "Los dólares de las tarjetas no entran en la cuenta. "}
        {aprox && "La cuota del préstamo de este mes es estimada."}
      </p>
    </section>
  );
}

// La barra de lo gastado en el recuadro "Gastaste": cada parte en su color sobre el ingreso; lo que
// no se gastó queda vacío, y si falta una parte, lo que no se sabe va rayado (no es cero)
function BarraGasto({ partes, base, faltaGasto }: { partes: Parte[]; base: number; faltaGasto: boolean }) {
  const conocidas = partes.filter((p) => p.monto != null && p.monto > 0);
  const sumado = conocidas.reduce((s, p) => s + p.monto!, 0);
  const total = base || sumado || 1;
  return (
    <div
      role="img"
      aria-label={`Gastaste: ${partes.map((p) => `${p.nombre} ${p.monto == null ? "falta" : pesos(p.monto)}`).join(", ")}`}
      className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-tarjeta"
    >
      {conocidas.map((p) => (
        <div key={p.nombre} style={{ flexGrow: 0, flexBasis: `${(p.monto! / total) * 100}%`, background: p.color }} />
      ))}
      {faltaGasto && total > sumado && (
        <div
          className="flex-1 rounded-r-full"
          style={{ backgroundImage: "repeating-linear-gradient(135deg, var(--suave) 0 2px, transparent 2px 6px)", opacity: 0.5 }}
        />
      )}
    </div>
  );
}

// Cada parte del mes contra lo normal: el monto, una barra con la rayita de lo normal y la diferencia.
// En el celular, la barra y la diferencia van debajo del nombre y el monto.
type FilaNormal = Parte & { normal: number | null; subirEsBueno: boolean; aprox?: boolean };

function ContraLoNormal({ filas }: { filas: FilaNormal[] }) {
  const columnas = "sm:grid-cols-[13rem_7.5rem_minmax(0,1fr)_9.5rem]";
  return (
    <div className="mt-4 divide-y divide-borde border-y border-borde">
      <div aria-hidden className={`hidden gap-x-4 py-1.5 text-xs font-semibold text-suave sm:grid ${columnas}`}>
        <span>Parte</span>
        <span className="text-right">Este mes</span>
        <span>Contra lo normal</span>
        <span className="text-right">Diferencia</span>
      </div>
      {filas.map((f) => {
        const tope = Math.max(f.monto ?? 0, f.normal ?? 0) * 1.12 || 1;
        return (
          <div key={f.nombre} className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 py-3 ${columnas}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <PuntoColor color={f.color} />
                {f.nombre}
              </div>
              {f.detalle && <div className="text-xs text-suave">{f.detalle}</div>}
            </div>
            <div className={`cifra text-right text-xl whitespace-nowrap ${f.monto != null && f.monto < 0 ? "text-peor" : ""}`}>
              {f.monto == null ? "—" : `${f.aprox ? "≈ " : ""}${pesos(f.monto)}`}
            </div>
            <div className="col-span-2 sm:col-span-1">
              {f.normal != null && (
                <div className="relative h-2 rounded-full bg-tarjeta" role="img" aria-label={`Lo normal: ${pesos(f.normal)}`}>
                  {f.monto != null && <div className="h-2 rounded-full" style={{ width: `${(Math.max(0, f.monto) / tope) * 100}%`, background: f.color }} />}
                  <div className="absolute -top-1 h-4 w-0.5 rounded bg-texto" style={{ left: `${(f.normal / tope) * 100}%` }} />
                </div>
              )}
            </div>
            <div className="col-span-2 text-xs text-suave sm:col-span-1 sm:text-right">
              {f.monto != null && f.normal != null ? (
                <>
                  <Variacion valor={variacion(f.monto, f.normal)} subirEsBueno={f.subirEsBueno} />
                  <span className="block">lo normal: {pesos(f.normal)}</span>
                </>
              ) : (
                <span>{f.normal != null ? `lo normal: ${pesos(f.normal)}` : "sin meses para comparar"}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const y = (l: string[]) => (l.length > 1 ? `${l.slice(0, -1).join(", ")} y ${l.at(-1)}` : l[0]);
