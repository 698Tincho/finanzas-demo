// Detalle de un mes: sueldo, tarjetas, cuotas pendientes y préstamo, de a dos columnas en pantallas
// anchas (como el reporte por mail)

import Link from "next/link";
import type { ReactNode } from "react";
import type { Banco, Config, Cuenta, Mes, PuntoSerie, Sueldo } from "@/lib/modelo";
import { BANCO, diaMes, dolares, nombreCompra, nombrePropio, pct, pesos, variacion } from "@/lib/formato";
import { Movimientos } from "./movimientos";
import { COLORES } from "./reparto";
import { CUENTAS, cuentasFaltantes, mesSolo, totalCuentas, valorEn } from "./resumen";
import { Barra, ComoSeCalcula, Nota, Variacion } from "./ui";

export function DetalleMes({ mes, anterior, serie, config }: { mes: Mes; anterior?: PuntoSerie; serie: PuntoSerie[]; config: Config }) {
  return (
    <div className="mt-9 grid items-start gap-3 md:grid-cols-2">
      <SeccionCredito mes={mes} />
      <SeccionSueldo mes={mes} />
      <SeccionCuentas mes={mes} serie={serie} />
      <SeccionAlquileres mes={mes} config={config} />
      <SeccionTarjetas mes={mes} anterior={anterior} />
      <SeccionCuotas mes={mes} />
    </div>
  );
}

function Bloque({ titulo, id, bajada, ancho, children }: { titulo: string; id: string; bajada?: ReactNode; ancho?: boolean; children: ReactNode }) {
  return (
    // Cada sección del detalle, en su recuadro (como los paneles de la referencia)
    <section id={id} className={`superficie min-w-0 scroll-mt-28 p-4 sm:p-5 lg:scroll-mt-16 ${ancho ? "md:col-span-2" : ""}`}>
      <h2 className="text-xl font-bold">{titulo}</h2>
      {bajada && <p className="mt-1 text-sm text-suave">{bajada}</p>}
      {children}
    </section>
  );
}

// Un renglón de importe: nombre a la izquierda, monto a la derecha
function Renglon({ nombre, monto, className = "", sangria }: { nombre: ReactNode; monto: ReactNode; className?: string; sangria?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${className}`}>
      <span className={sangria ? "pl-4 text-suave" : ""}>{nombre}</span>
      <span className="num">{monto}</span>
    </div>
  );
}

function SeccionSueldo({ mes }: { mes: Mes }) {
  const [actual, anterior] = mes.sueldos;
  const { resumen, periodos } = mes;
  if (!actual) {
    return (
      <Bloque titulo="Sueldo" id="sueldo">
        <Nota>Todavía no está el recibo de sueldo de este mes.</Nota>
      </Bloque>
    );
  }
  // Si todo cambió lo mismo que el líquido (el aumento), se dice una vez arriba; en cada rubro solo
  // va la variación que es distinta
  const redondeo = (v: number | null) => (v == null ? null : Math.round(v * 1000));
  const delLiquido = variacion(actual.liquido, anterior?.liquido);
  const valorAntes = (f: (s: Sueldo) => number | null | undefined) => (anterior ? f(anterior) : null);
  const distinta = (f: (s: Sueldo) => number | null | undefined) => {
    const v = variacion(f(actual), valorAntes(f));
    return v != null && redondeo(v) !== redondeo(delLiquido) ? v : null;
  };
  const todosIgual = distinta((s) => s.bruto) == null && Object.keys(actual.descuentos).every((g) => distinta((s) => s.descuentos[g]) == null);
  // Lo cobrado que no es el líquido del recibo de sueldo ni un recibo aparte: los adelantos que el recibo descuenta
  const adelantosYaCobrados = resumen.cobrado - actual.liquido - resumen.otrosIngresos.reduce((t, r) => t + r.liquido, 0);
  const nombreAnterior = mesSolo(periodoANombre(periodos[1]));

  return (
    <Bloque
      titulo="Sueldo"
      id="sueldo"
      bajada={
        <>
          {resumen.empresa ? `De ${nombrePropio(resumen.empresa)}` : "Recibo de sueldo"}
          {delLiquido != null && (
            <>
              {" · "}
              <Variacion valor={delLiquido} subirEsBueno /> {todosIgual ? "en todos los rubros" : "el líquido"} vs. {nombreAnterior}
            </>
          )}
        </>
      }
    >
      {/* Qué cobraste: cada renglón del recibo que se cobra en plata (lo de en especie no) */}
      {actual.haberes && actual.haberes.length > 0 && (
        <>
          <h3 className="mt-4 text-xs font-semibold text-suave">Qué cobraste</h3>
          <div className="text-sm">
            {actual.haberes.map((h) => (
              <Renglon
                key={h.concepto}
                sangria
                nombre={
                  <>
                    {h.concepto}
                    {h.concepto === "Sueldo mensual" && actual.licencia && <span className="text-suave"> · con días de licencia</span>}
                  </>
                }
                monto={<span className={h.importe < 0 ? "text-suave" : ""}>{h.importe < 0 ? `− ${pesos(-h.importe)}` : pesos(h.importe)}</span>}
              />
            ))}
          </div>
        </>
      )}
      <div className="mt-1 text-sm">
        <Renglon nombre={<b>Bruto (haberes)</b>} monto={<b>{pesos(actual.bruto)}</b>} className="border-y border-borde" />
        {Object.entries(actual.descuentos).map(([g, monto]) => {
          const v = distinta((s) => s.descuentos[g]);
          return (
            <Renglon
              key={g}
              sangria
              nombre={
                <>
                  {g}
                  {v != null && (
                    <>
                      {" "}
                      <Variacion valor={v} subirEsBueno={false} />
                    </>
                  )}
                </>
              }
              monto={<span className="text-suave">− {pesos(monto)}</span>}
            />
          );
        })}
        <Renglon nombre={<b>Líquido en pesos</b>} monto={<b>{pesos(actual.liquido)}</b>} className="border-t border-borde" />
        {/* Los recibos aparte (aguinaldo, retroactivos), cada uno con su nombre y cuándo se cobró */}
        {resumen.otrosIngresos.map((r, i) => (
          <Renglon
            key={`${r.tipo}-${i}`}
            nombre={
              <>
                + {r.nombre ?? r.descripcion ?? r.tipo}
                {r.adelanto ? (
                  <span className="text-suave"> · cobrado como adelanto</span>
                ) : (
                  r.fechaPago && <span className="text-suave"> · cobrado el {diaMes(r.fechaPago)}</span>
                )}
              </>
            }
            monto={pesos(r.liquido)}
          />
        ))}
        {adelantosYaCobrados !== 0 && (
          <Renglon nombre={adelantosYaCobrados > 0 ? "+ Cobrado antes como adelanto" : "− Adelantos ya cobrados"} monto={pesos(Math.abs(adelantosYaCobrados))} />
        )}
        <Renglon nombre="+ Ticket alimentación" monto={pesos(resumen.tickets)} />
        <Renglon
          nombre={<span className="font-bold">Sueldo + ticket</span>}
          monto={<span className="cifra text-xl">{pesos(resumen.cobrado + resumen.tickets)}</span>}
          className="border-t-2 border-texto"
        />
      </div>
      <Nota>
        Descuentos: {pesos(actual.totalDescuentos)}
        {actual.bruto ? ` (${pct(actual.totalDescuentos / actual.bruto)} del bruto)` : ""}.
      </Nota>
      {actual.cobertura > 0 && (
        <Nota>El recibo también suma {pesos(actual.cobertura)} de cobertura médica en especie, que no se cobra.</Nota>
      )}
      {resumen.adelantos > 0 && (
        <Nota>
          Los recibos descuentan {pesos(resumen.adelantos)} de adelantos que cobraste antes (por ejemplo, el salario
          vacacional): se suman acá porque esa plata sí te llegó.
        </Nota>
      )}
      {resumen.otrosIngresos.some((r) => r.bruto != null && r.bruto !== r.liquido) && (
        <Nota>
          {resumen.otrosIngresos
            .filter((r) => r.bruto != null && r.bruto !== r.liquido)
            .map((r) => `${r.nombre ?? r.tipo}: ${pesos(r.bruto!)} de bruto, ${pesos(r.bruto! - r.liquido)} de descuentos`)
            .join(". ")}
          .
        </Nota>
      )}
    </Bloque>
  );
}

function SeccionTarjetas({ mes, anterior }: { mes: Mes; anterior?: PuntoSerie }) {
  const { tarjetas, consumos } = mes;
  if (!tarjetas.length) {
    return (
      <Bloque titulo="Tarjetas" id="tarjetas" ancho>
        <Nota>Todavía no llegaron los estados de cuenta de este mes.</Nota>
      </Bloque>
    );
  }
  const total = tarjetas.reduce((s, t) => s + t.uyu.total, 0);
  const faltan = (Object.keys(BANCO) as Banco[]).filter((b) => !tarjetas.some((t) => t.banco === b));
  const totalAntes = anterior?.tarjetas.length === Object.keys(BANCO).length ? anterior.tarjetas.reduce((s, t) => s + t.uyu, 0) : null;
  const cargos = tarjetas.reduce((s, t) => s + t.uyu.banco, 0);
  const iva = tarjetas.reduce((s, t) => s + t.uyu.iva, 0);

  return (
    <Bloque
      titulo="Tarjetas"
      id="tarjetas"
      ancho
      bajada={
        <>
          {pesos(total)} en total
          {!faltan.length && totalAntes != null && anterior && (
            <>
              {" · "}
              <Variacion valor={variacion(total, totalAntes)} subirEsBueno={false} /> vs. {mesSolo(anterior.nombre)}
            </>
          )}
        </>
      }
    >
      <Movimientos compras={consumos.filter((m) => m.uyu > 0 || m.usd > 0)} faltan={faltan} mes={mesSolo(mes.nombre)} />
      {(cargos !== 0 || iva !== 0) && (
        <Nota>
          {cargos !== 0 && `El total incluye ${pesos(cargos)} de cargos del banco (intereses, seguros, recargo por compras en el exterior)`}
          {cargos !== 0 && iva !== 0 && " y "}
          {iva !== 0 && `${cargos !== 0 ? "" : "El total incluye "}un reintegro de IVA de ${pesos(Math.abs(iva))}`}.
        </Nota>
      )}
    </Bloque>
  );
}

export function SeccionCuotas({ mes }: { mes: Mes }) {
  const { cuotas } = mes;
  if (!cuotas.length) return null;
  const totalUyu = cuotas.reduce((s, c) => s + c.restaUyu, 0);
  const totalUsd = cuotas.reduce((s, c) => s + c.restaUsd, 0);
  return (
    <Bloque
      titulo="Cuotas pendientes"
      id="cuotas"
      bajada={
        <>
          Ya comprometido para los próximos meses: <b className="whitespace-nowrap text-texto">{pesos(totalUyu)}</b>
          {totalUsd > 0 && <> y <b className="text-texto">{dolares(totalUsd)}</b></>}
        </>
      }
    >
      <ul className="mt-3 text-sm">
        {cuotas.map((c, i) => (
          <li key={i} className="flex items-center gap-3 py-1.5">
            <span className="min-w-0 flex-1">
              <Punto banco={c.banco} className="mr-1.5" />
              {nombreCompra(c.detalle)}
            </span>
            <Avance n={c.n} total={c.total} />
            <span className="num w-20 font-bold">{c.uyu ? pesos(c.restaUyu) : dolares(c.restaUsd)}</span>
          </li>
        ))}
      </ul>
    </Bloque>
  );
}

// Cuentas de la casa pagadas desde el banco este mes. Una que se pagó en los meses anteriores y
// este no, falta: se muestra con "—", no como cero.
function SeccionCuentas({ mes, serie }: { mes: Mes; serie: PuntoSerie[] }) {
  const pagos = mes.pagos ?? [];
  const faltan = cuentasFaltantes(serie, mes.periodo);
  const filas: { cuenta: Cuenta; fecha: string | null; monto: number | null }[] = [
    ...pagos.map((p) => ({ cuenta: p.cuenta, fecha: p.fecha, monto: p.monto })),
    ...faltan.map((cuenta) => ({ cuenta, fecha: null, monto: null })),
  ];
  const lista = (l: Cuenta[]) => (l.length > 1 ? `${l.slice(0, -1).map((k) => CUENTAS[k]).join(", ")} y ${CUENTAS[l.at(-1)!]}` : CUENTAS[l[0]]);
  return (
    <Bloque titulo="Cuentas de la casa" id="cuentas-casa">
      {filas.length === 0 ? (
        <Nota>No hay pagos de UTE ni de Antel este mes. Se leen solos de los mails de confirmación del banco cuando corre el pipeline.</Nota>
      ) : (
        <div className="mt-3 text-sm">
          {filas.map((f) => (
            <Renglon
              key={f.cuenta}
              className="border-b border-borde"
              nombre={
                <>
                  {CUENTAS[f.cuenta]} <span className="text-suave">{f.fecha ? `· ${diaMes(f.fecha)}` : "· falta el pago"}</span>
                </>
              }
              monto={f.monto == null ? "—" : pesos(f.monto)}
            />
          ))}
          {pagos.length > 0 && <Renglon nombre={<b>Total</b>} monto={<b>{pesos(totalCuentas(pagos))}</b>} />}
        </div>
      )}
      {faltan.length > 0 && (
        <Nota>Todavía no llegó el mail del banco de {lista(faltan)}. Si ya la pagaste, aparece cuando corre el pipeline.</Nota>
      )}
    </Bloque>
  );
}

// Los dos alquileres del mes, como estaban en /configuracion ese mes
function SeccionAlquileres({ mes, config }: { mes: Mes; config: Config }) {
  const hay = (l: Config["cobras"]) => l.some((v) => v.desde <= mes.periodo);
  if (!hay(config.cobras) && !hay(config.pagas)) {
    return (
      <Bloque titulo="Alquileres" id="alquileres">
        <Nota>
          Todavía no cargaste los alquileres. Se cargan una vez en{" "}
          <Link href="/configuracion" className="font-semibold text-link hover:underline">
            Configuración
          </Link>
          .
        </Nota>
      </Bloque>
    );
  }
  const cobrado = valorEn(config.cobras, mes.periodo);
  const pagado = valorEn(config.pagas, mes.periodo);
  return (
    <Bloque titulo="Alquileres" id="alquileres">
      <div className="mt-3 text-sm">
        <Renglon nombre="Alquiler que cobrás" monto={pesos(cobrado)} className="border-b border-borde" />
        <Renglon
          nombre={
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: COLORES.alquiler }} />
              Alquiler que pagás
            </span>
          }
          monto={<span className="text-suave">− {pesos(pagado)}</span>}
          className="border-b border-borde"
        />
        <Renglon nombre={<b>Diferencia</b>} monto={<b>{cobrado - pagado < 0 ? `− ${pesos(pagado - cobrado)}` : pesos(cobrado - pagado)}</b>} />
      </div>
      <Nota>
        Los montos salen de{" "}
        <Link href="/configuracion" className="font-semibold text-link hover:underline">
          Configuración
        </Link>
        : si cambian, cargá el nuevo desde el mes en que cambia.
      </Nota>
    </Bloque>
  );
}

// Cuotas pagadas de una compra: un segmento por cuota (o una barra si son muchas)
function Avance({ n, total }: { n: number; total: number }) {
  const etiqueta = `cuota ${n} de ${total}`;
  if (total > 12) {
    return (
      <span className="w-20 shrink-0" role="img" aria-label={etiqueta} title={etiqueta}>
        <Barra fraccion={n / total} color="var(--texto)" />
      </span>
    );
  }
  return (
    <span className="flex w-20 shrink-0 gap-0.5" role="img" aria-label={etiqueta} title={etiqueta}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < n ? "bg-texto" : "bg-borde"}`} />
      ))}
    </span>
  );
}

// En el reporte del mes, solo lo de este mes: el débito. Los datos del préstamo y todos los
// débitos están en /prestamo.
function SeccionCredito({ mes }: { mes: Mes }) {
  const { hayDatos, cuotasTotales } = mes.credito;
  const h = mes.credito.mes;
  if (!hayDatos) {
    return (
      <Bloque titulo="Préstamo" id="credito">
        <Nota>Para ver el préstamo, bajá un estado de la cuenta desde el home banking y dejalo en archivo/entradas/.</Nota>
      </Bloque>
    );
  }
  if (!h) return null;

  return (
    <Bloque titulo="Préstamo" id="credito">
      <div className="mt-3 rounded-2xl bg-credito-fondo p-4 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold text-credito-texto">
            {h.real ? `Débito del ${diaMes(h.fecha)}` : `Débito estimado del ${diaMes(h.fecha)}`}
          </span>
          <span className="cifra text-2xl">{h.real ? "" : "≈ "}{pesos(h.total)}</span>
        </div>
        {h.real && (
          <div className="mt-2 text-suave">
            {h.lineas.map((l, i) => (
              <div key={i} className="flex justify-between gap-3">
                <span>{l.nombre ?? `${l.concepto} ${l.detalle}`.trim()}</span>
                <span className="num">{pesos(l.importe)}</span>
              </div>
            ))}
          </div>
        )}
        {h.cuota && cuotasTotales && (
          <div className="mt-3">
            <Barra fraccion={h.cuota / cuotasTotales} />
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-suave">
          <span>{h.cuota && cuotasTotales ? `${h.cuota} de ${cuotasTotales} cuotas` : ""}</span>
          <Link href="/prestamo" className="text-sm font-semibold text-link hover:underline">
            Ver el préstamo →
          </Link>
        </div>
      </div>
      {!h.real && (
        <>
          <Nota>{NOTA_ESTIMADO_CORTA}</Nota>
          <ComoSeCalcula>
            <p>{NOTA_ESTIMADO}</p>
          </ComoSeCalcula>
        </>
      )}
    </Bloque>
  );
}

function Punto({ banco, className = "" }: { banco: string; className?: string }) {
  return (
    <>
      <span aria-hidden className={`inline-block size-2 shrink-0 rounded-full align-middle ${className}`} style={{ background: `var(--serie-${banco}, var(--suave))` }} />
      <span className="sr-only">{BANCO[banco] ?? banco}: </span>
    </>
  );
}



export const NOTA_ESTIMADO_CORTA = "Débito estimado: todavía no está el estado de la cuenta del banco.";
export const NOTA_ESTIMADO =
  "Sin el estado de cuenta, el débito se calcula con la cuota en UI y el valor de la UI del día del débito (el 5, o el lunes siguiente si cae en fin de semana), más los cargos que van aparte. Para confirmarlo, bajá el estado de la cuenta del home banking a archivo/entradas/.";

// "2026-09" -> "Setiembre 2026"
const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
export const nombreCorto = (p: string) => `${MESES[Number(p.slice(5, 7))]} ${p.slice(0, 4)}`;
const periodoANombre = nombreCorto;
