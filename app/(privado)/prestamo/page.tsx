// Préstamo: cuánto debés y cuánto falta, cuánto te cuesta neto (el débito menos el alquiler que
// cobrás), lo que conviene saber del préstamo, cómo baja la deuda, los datos fijos y todos los
// débitos. Los datos fijos salen del último mes con débito; la lista y los gráficos de meses, de la
// serie de todos los meses.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NOTA_ESTIMADO, nombreCorto } from "@/components/detalle";
import {
  GraficoDebitos,
  GraficoInteresCapital,
  GraficoSaldo,
  GraficoUiDolar,
  type AnioCuotas,
  type PuntoIndice,
} from "@/components/graficos-credito";
import { CostoNeto } from "@/components/costo-neto";
import { DatosPrestamo, ListaDebitos } from "@/components/credito";
import { pctEntero } from "@/components/resumen";
import { IconoCalendario, IconoBanco } from "@/components/iconos";
import { COLORES } from "@/components/reparto";
import { ComoSeCalcula, Kpi, Nota, Seccion } from "@/components/ui";
import {
  diaMes,
  dolaresEnteros,
  enUI,
  fechaLarga,
  numero,
  pct,
  pesos,
} from "@/lib/formato";
import { leerConfig, leerMes, leerSerie } from "@/lib/modelo";
import { amortizacion, sumarMeses } from "@/lib/prestamo";

export const metadata: Metadata = { title: "Préstamo · Finanzas" };

const decimal = (n: number) =>
  new Intl.NumberFormat("es-UY", { maximumFractionDigits: 1 }).format(n);
// Tasas: con dos decimales, como en el contrato
const dosDecimales = (n: number) =>
  new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2 }).format(n);
// "+31 %" con signo, para los recuadros de "Lo que hay que saber"
const conSigno = (x: number) =>
  `${x > 0 ? "+" : x < 0 ? "−" : ""}${decimal(Math.abs(x) * 100)} %`;
const mesesEntre = (a: string, b: string) =>
  (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 +
  Number(b.slice(5, 7)) -
  Number(a.slice(5, 7));

export default async function PaginaCredito() {
  const [serie, config] = await Promise.all([leerSerie(), leerConfig()]);
  const debitos = serie.filter((p) => p.credito);
  const ultimo = debitos.at(-1);
  const mes = ultimo ? await leerMes(ultimo.periodo) : null;
  const h = mes?.credito.mes;

  if (!mes || !h || !ultimo) {
    return (
      <main>
        <h1 className="text-2xl font-bold">Préstamo</h1>
        <p className="mt-2 max-w-prose text-sm text-suave">
          Todavía no hay débitos del préstamo. Para verlos, bajá un estado de
          la cuenta desde el home banking y dejalo en archivo/entradas/.
        </p>
      </main>
    );
  }
  const { cuotasTotales, estimado, uiHoy, dolarHoy, inicio } = mes.credito;
  const saldo = estimado?.saldoUI ?? null;
  // Con el contrato los números del préstamo son exactos; si no, estimados con los débitos
  const exacto = Boolean(estimado?.contrato);
  const avance = h.cuota && cuotasTotales ? h.cuota / cuotasTotales : null;
  const faltan = h.cuota && cuotasTotales ? cuotasTotales - h.cuota : null;
  const capitalPagado =
    estimado && saldo != null ? 1 - saldo / estimado.capitalInicialUI : null;

  // Cuadro de amortización: de qué mes es cada cuota, contando desde la del último débito
  const filas = estimado && h.cuota ? amortizacion(estimado) : [];
  const periodoDe = (n: number) => sumarMeses(ultimo.periodo, n - h.cuota!);
  const puntosSaldo = filas.map((f) => ({
    n: f.n,
    periodo: periodoDe(f.n),
    saldo: f.saldo,
  }));
  const anios: AnioCuotas[] = [];
  for (const f of filas) {
    const anio = periodoDe(f.n).slice(0, 4);
    let a = anios.at(-1);
    if (a?.anio !== anio)
      anios.push(
        (a = { anio, capital: 0, interes: 0, seguro: 0, saldo: 0, cuotas: 0 }),
      );
    a.capital += f.capital;
    a.interes += f.interes;
    a.seguro += f.seguro;
    a.saldo = f.saldo;
    a.cuotas++;
  }
  const proxima = filas.find((f) => f.n === h.cuota! + 1);
  // Desde qué cuota más de la mitad de la cuota es capital (baja la deuda)
  const mitad = filas.find(
    (f) => f.n > 1 && f.capital > (f.capital + f.interes + f.seguro) / 2,
  );

  // UI y dólar desde el día del préstamo, como índice (ese día = 100)
  const indices: PuntoIndice[] = [];
  if (inicio?.ui && inicio.dolar) {
    const punto = (
      fecha: string,
      ui: number | null | undefined,
      dolar: number | null | undefined,
    ) => {
      if (ui && dolar)
        indices.push({
          fecha,
          ui: (ui / inicio.ui!) * 100,
          dolar: (dolar / inicio.dolar!) * 100,
        });
    };
    punto(inicio.fecha, inicio.ui, inicio.dolar);
    for (const p of serie)
      if (p.cotizacion && p.cotizacion.fecha > inicio.fecha)
        punto(p.cotizacion.fecha, p.cotizacion.ui, p.cotizacion.dolar);
    if (uiHoy && dolarHoy && uiHoy.fecha > (indices.at(-1)?.fecha ?? ""))
      punto(uiHoy.fecha, uiHoy.valor, dolarHoy.valor);
  }

  // Lo que hay que saber: tres datos que no se ven en los números sueltos
  const saber: {
    cifra: string;
    peor?: boolean;
    titulo: string;
    texto: ReactNode;
  }[] = [];
  if (
    estimado &&
    saldo != null &&
    inicio?.ui &&
    inicio.dolar &&
    uiHoy &&
    dolarHoy
  ) {
    const prestado = (estimado.capitalInicialUI * inicio.ui) / inicio.dolar;
    const hoy = (saldo * uiHoy.valor) / dolarHoy.valor;
    const cambio = hoy / prestado - 1;
    saber.push({
      cifra: conSigno(cambio),
      peor: cambio > 0,
      titulo:
        cambio > 0
          ? "En dólares debés más que al firmar"
          : "En dólares debés menos que al firmar",
      texto: (
        <>
          Pediste {exacto ? "" : "≈ "}
          {dolaresEnteros(prestado)} y hoy debés ≈ {dolaresEnteros(hoy)}. Desde{" "}
          {inicio.fecha.slice(0, 4)} la UI subió{" "}
          {pctEntero(uiHoy.valor / inicio.ui - 1)} y el dólar{" "}
          {pct(dolarHoy.valor / inicio.dolar - 1)}.
        </>
      ),
    });
  }
  // Desde la segunda cuota: la primera fue más larga (y más cara) que las demás
  const primero = debitos.find((p) => p.credito!.cuota !== 1) ?? debitos[0];
  if (primero !== ultimo) {
    const meses = mesesEntre(primero.periodo, ultimo.periodo);
    const desde = primero.credito!.total,
      hasta = ultimo.credito!.total;
    saber.push({
      cifra: conSigno(hasta / desde - 1),
      titulo: "El débito sube aunque la cuota es fija",
      texto: (
        <>
          De {pesos(desde)} ({nombreCorto(primero.periodo).toLowerCase()}) a{" "}
          {pesos(hasta)} ({nombreCorto(ultimo.periodo).toLowerCase()}): unos{" "}
          {pesos((hasta - desde) / meses)} más por mes, siguiendo a la UI.
        </>
      ),
    });
  }
  if (estimado && proxima) {
    saber.push({
      cifra: pctEntero(
        proxima.interes / (proxima.interes + proxima.capital + proxima.seguro),
      ),
      titulo: "De cada cuota todavía es interés",
      texto: mitad
        ? mitad.n > h.cuota!
          ? `Desde la cuota ${mitad.n} (${nombreCorto(periodoDe(mitad.n)).toLowerCase()}), más de la mitad de cada cuota baja tu deuda. La cuota no cambia.`
          : `Desde la cuota ${mitad.n}, más de la mitad de cada cuota baja tu deuda. La cuota no cambia.`
        : "El resto de la cuota baja tu deuda.",
    });
  }

  return (
    <main>
      <h1 className="text-2xl font-bold">Préstamo</h1>
      <p className="text-sm text-suave">
        Préstamo en Unidades Indexadas · último débito{" "}
        {fechaLarga(h.fecha)}
        {h.real ? "" : " (débito estimado)"}
      </p>

      <section className="mt-6" aria-label="Cuánto debés">
        {saldo != null ? (
          <>
            <div className="text-sm text-suave">
              {exacto ? "Debés hoy" : "Debés hoy (estimado)"}
            </div>
            <div className="cifra text-hero">{numero(saldo)} UI</div>
            {uiHoy && (
              <div className="text-sm text-suave">
                ≈ {pesos(saldo * uiHoy.valor)}
                {dolarHoy && (
                  <>
                    {" "}
                    · ≈ {dolaresEnteros((saldo * uiHoy.valor) / dolarHoy.valor)}
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-suave">Cuotas pagadas</div>
            <div className="cifra text-hero">{h.cuota ?? "—"}</div>
          </>
        )}
        {avance != null && (
          <div className="mt-3">
            {/* Dos avances en la misma barra: el capital pagado (lleno) y las cuotas pagadas (claro) */}
            <div
              className="relative h-2 rounded-full bg-credito-fondo"
              role="img"
              aria-label={`${h.cuota} de ${cuotasTotales} cuotas pagadas${capitalPagado != null ? `, ${pct(capitalPagado)} del capital` : ""}`}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  width: `${avance * 100}%`,
                  background: "var(--serie-credito)",
                  opacity: 0.45,
                }}
              />
              {capitalPagado != null && (
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${capitalPagado * 100}%`,
                    background: "var(--serie-credito)",
                  }}
                />
              )}
            </div>
            <div className="mt-1.5 text-xs text-suave">
              <b className="text-texto">
                {h.cuota} de {cuotasTotales}
              </b>{" "}
              cuotas pagadas ({pctEntero(avance)})
              {capitalPagado != null && (
                <> · {pct(capitalPagado)} del capital</>
              )}
            </div>
          </div>
        )}

        {/* Tres recuadros iguales, de lado a lado (antes iban en un costado y se cortaban) */}
        {/* En el celular, el débito a lo ancho y la tasa y lo que falta de a dos */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="col-span-2 grid sm:col-span-1">
            <Kpi
              icono={<IconoBanco color={COLORES.credito} />}
              titulo={`Débito de ${nombreCorto(ultimo.periodo).split(" ")[0].toLowerCase()}`}
              valor={`${h.real ? "" : "≈ "}${pesos(h.total)}`}
              detalle={
                estimado
                  ? exacto
                    ? `cuota ${numero(estimado.cuotaUI)} UI con seguro, más cargos`
                    : `cuota ${numero(estimado.cuotaUI)} UI + seguro`
                  : undefined
              }
              pie={{
                izquierda: (
                  <>
                    <IconoCalendario />
                    {h.real ? "debitado el" : "se debita el"} {diaMes(h.fecha)}
                  </>
                ),
                derecha: h.real ? undefined : "estimado",
              }}
            />
          </div>
          {estimado && (
            <Kpi
              titulo="Tasa"
              valor={`${dosDecimales(estimado.tasaAnual * 100)} %`}
              detalle={
                exacto
                  ? "efectiva anual, sobre UI"
                  : "anual, sobre UI (estimada)"
              }
              pie={{
                izquierda: exacto ? "del contrato" : "estimada con los débitos",
              }}
            />
          )}
          {faltan != null && (
            <Kpi
              titulo="Te faltan"
              valor={`${faltan} cuotas`}
              detalle={`${decimal(faltan / 12)} años`}
              pie={{
                izquierda: (
                  <>
                    <IconoCalendario />
                    la última en{" "}
                    {nombreCorto(
                      sumarMeses(ultimo.periodo, faltan),
                    ).toLowerCase()}
                  </>
                ),
              }}
            />
          )}
        </div>
      </section>

      <CostoNeto debitos={debitos} config={config} />

      {saber.length > 0 && (
        <Seccion titulo="Lo que hay que saber">
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {saber.map((s) => (
              <div key={s.titulo} className="superficie p-4">
                <div className={`cifra text-2xl ${s.peor ? "text-peor" : ""}`}>
                  {s.cifra}
                </div>
                <div className="mt-1 text-sm font-bold">{s.titulo}</div>
                <p className="mt-1 text-xs text-suave">{s.texto}</p>
              </div>
            ))}
          </div>
        </Seccion>
      )}

      {puntosSaldo.length > 0 && (
        <GraficoSaldo puntos={puntosSaldo} actual={h.cuota!} />
      )}
      {(anios.length > 0 || indices.length > 1) && (
        <div className="grid gap-x-8 md:grid-cols-2">
          {anios.length > 0 && (
            <GraficoInteresCapital
              anios={anios}
              anioActual={ultimo.periodo.slice(0, 4)}
            />
          )}
          {indices.length > 1 && <GraficoUiDolar puntos={indices} />}
        </div>
      )}
      <GraficoDebitos
        puntos={debitos.map((p) => ({ periodo: p.periodo, ...p.credito! }))}
      />

      <Seccion titulo="Datos del préstamo">
        <DatosPrestamo credito={mes.credito} h={h} />
      </Seccion>

      <Seccion titulo="Todos los débitos">
        <ListaDebitos debitos={debitos} />
        <Nota>
          Los montos de los meses con estado de cuenta son los del banco. Tocá un
          mes para ver su reporte.
        </Nota>
        <ComoSeCalcula>
          {estimado && exacto ? (
            <>
              <p>
                El préstamo, la tasa y el cuadro de cuotas salen del contrato y
                su Anexo I. Cada cuota paga el interés del saldo (la tasa
                nominal dividida 12), el seguro de vida (
                {pct(estimado.seguroVida ?? 0)} del saldo) y el resto es
                capital: como el saldo baja, cada mes es un poco más capital. El
                saldo coincide con el cuadro del banco.
              </p>
              <p>
                El débito de {nombreCorto(ultimo.periodo).toLowerCase()} fue de{" "}
                {enUI(h.totalUI)}: la cuota fija ({enUI(estimado.cuotaUI)}:
                interés, capital y seguro de vida) más la tasa de control
                regulatorio y la prestación de la Ley 18.396, que van aparte. Es
                fija en UI, así que en pesos sube con la UI; en dólares cambia
                según cuánto suba la UI frente al dólar (cotización del BCU).
              </p>
            </>
          ) : estimado ? (
            <>
              <p>
                El banco no muestra el saldo: el préstamo, la tasa y el saldo se
                estiman con los débitos de los estados de cuenta. Cada débito
                separa interés y capital, y en una cuota fija el capital crece
                mes a mes según la tasa. Puede diferir algo de lo que diga el
                banco.
              </p>
              <p>
                El débito de {nombreCorto(ultimo.periodo).toLowerCase()} fue de{" "}
                {enUI(h.totalUI)}: la cuota fija ({enUI(estimado.cuotaUI)},
                interés + capital) más seguros y otros cargos. Es fijo en UI,
                así que en pesos sube con la UI; en dólares cambia según cuánto
                suba la UI frente al dólar (cotización del BCU).
              </p>
            </>
          ) : (
            <p>
              El avance es por cantidad de cuotas: el banco no muestra el saldo del
              préstamo. En un préstamo de cuota fija las primeras cuotas son
              sobre todo intereses, así que la parte de la deuda ya pagada es
              menor.
            </p>
          )}
          {debitos.some((p) => !p.credito!.real) && <p>{NOTA_ESTIMADO}</p>}
        </ComoSeCalcula>
      </Seccion>
    </main>
  );
}
