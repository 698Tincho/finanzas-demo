"use client";

// Gráficos de /prestamo: el saldo cuota a cuota, interés y capital por año, la UI frente al dólar y
// el débito de cada mes en pesos. Los datos llegan ya calculados desde la página.

import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { pesos } from "@/lib/formato";
import { CajaTooltip, COLOR, corto, ejes, Leyenda, miles, Tarjeta, VerTabla } from "./graficos";

const entero = (n: number) => new Intl.NumberFormat("es-UY", { maximumFractionDigits: 0 }).format(n);
const UI_CORTA = (n: number) => `${entero(n)} UI`;

// ---------- Saldo, cuota a cuota ----------

export type PuntoSaldo = { n: number; periodo: string; saldo: number };

export function GraficoSaldo({ puntos, actual }: { puntos: PuntoSaldo[]; actual: number }) {
  const datos = puntos.map((p) => ({ ...p, pagado: p.n <= actual ? p.saldo : null, falta: p.n >= actual ? p.saldo : null }));
  const ultimo = puntos.at(-1)!.n;
  const hoy = puntos.find((p) => p.n === actual);
  // Marcas: la primera y la última cuota, y cada enero de un año terminado en 0 o 5
  // (sin las que quedan pegadas a la primera o la última)
  const marcas = [
    1,
    ...puntos.filter((p) => p.periodo.endsWith("-01") && Number(p.periodo.slice(0, 4)) % 5 === 0 && p.n > 24 && p.n < ultimo - 24).map((p) => p.n),
    ultimo,
  ];
  const etiqueta = (n: number) => (n === 1 ? "cuota 1" : n === ultimo ? `cuota ${ultimo}` : puntos.find((p) => p.n === n)?.periodo.slice(0, 4) ?? "");

  return (
    <Tarjeta titulo="Cuánto debés, cuota a cuota" subtitulo="Saldo en UI. Línea llena: lo pagado; punteada: lo que falta si se mantienen tasa y cuota.">
      <div className="mt-2 h-56" role="img" aria-label={`Gráfico del saldo del préstamo: hoy ${hoy ? UI_CORTA(hoy.saldo) : ""}, baja hasta cero en la cuota ${ultimo}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={datos} margin={{ top: 18, right: 12, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--grilla)" />
            <XAxis dataKey="n" type="number" domain={[1, ultimo]} ticks={marcas} tickFormatter={etiqueta} {...ejes} />
            <YAxis tickFormatter={miles} {...ejes} axisLine={false} width={60} domain={[0, "auto"]} />
            <Tooltip
              cursor={{ stroke: "var(--eje)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as (typeof datos)[number] | undefined;
                if (!active || !d) return null;
                return <CajaTooltip titulo={`Cuota ${d.n} (${corto(d.periodo)})`} filas={[{ color: COLOR.credito, nombre: d.n <= actual ? "Saldo" : "Saldo previsto", valor: UI_CORTA(d.saldo) }]} />;
              }}
            />
            <Area dataKey="pagado" stroke={COLOR.credito} strokeWidth={2} fill={COLOR.credito} fillOpacity={0.12} isAnimationActive={false} connectNulls={false} dot={false} />
            <Line dataKey="falta" stroke={COLOR.credito} strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false} dot={false} connectNulls={false} />
            {hoy && (
              <ReferenceLine
                x={actual}
                stroke="var(--eje)"
                strokeDasharray="2 3"
                label={{ value: `Hoy · ${UI_CORTA(hoy.saldo)}`, position: "insideTopLeft", fill: "var(--texto)", fontSize: 13, fontWeight: 600 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-suave">El saldo de fin de cada año está en la tabla de interés y capital.</p>
    </Tarjeta>
  );
}

// ---------- Interés y capital por año ----------

export type AnioCuotas = { anio: string; capital: number; interes: number; seguro: number; saldo: number; cuotas: number };

export function GraficoInteresCapital({ anios, anioActual }: { anios: AnioCuotas[]; anioActual: string }) {
  // "hoy" en el año actual y los años redondos, salvo los que se pisarían con "hoy"
  const conSeguro = anios.some((a) => a.seguro > 0);
  const marca = (a: string) => (a === anioActual ? "hoy" : Number(a) % 5 === 0 && Math.abs(Number(a) - Number(anioActual)) > 2 ? a : "");
  return (
    <Tarjeta titulo={conSeguro ? "Capital, interés y seguro por año" : "Interés y capital por año"} subtitulo="En UI. Cada año pagás lo mismo; cambia cuánto es tuyo.">
      <Leyenda
        items={[
          { color: COLOR.credito, texto: "Capital" },
          { color: "var(--credito-fondo)", texto: "Interés" },
          ...(conSeguro ? [{ color: "var(--barra)", texto: "Seguro de vida" }] : []),
        ]}
      />
      <div className="mt-2 h-52" role="img" aria-label="Gráfico de cuánto de las cuotas de cada año es capital y cuánto interés; los mismos datos están en la tabla">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={anios} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="15%">
            <XAxis
              dataKey="anio"
              {...ejes}
              interval={0}
              tick={({ x, y, payload }: { x?: number | string; y?: number | string; payload?: { value: string } }) => (
                <text x={x} y={Number(y ?? 0) + 14} textAnchor="middle" fontSize={13} fill={payload?.value === anioActual ? "var(--texto)" : "var(--eje)"} fontWeight={payload?.value === anioActual ? 700 : 400}>
                  {payload ? marca(payload.value) : ""}
                </text>
              )}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "var(--tarjeta)" }}
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as AnioCuotas | undefined;
                if (!active || !d) return null;
                return (
                  <CajaTooltip
                    titulo={`${d.anio} (${d.cuotas} cuotas)`}
                    filas={[
                      { color: COLOR.credito, nombre: "Capital", valor: UI_CORTA(d.capital) },
                      { color: "var(--credito-fondo)", nombre: "Interés", valor: UI_CORTA(d.interes) },
                      ...(d.seguro ? [{ color: "var(--barra)", nombre: "Seguro de vida", valor: UI_CORTA(d.seguro) }] : []),
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="capital" stackId="c" fill={COLOR.credito} isAnimationActive={false} />
            <Bar dataKey="interes" stackId="c" fill="var(--credito-fondo)" stroke={COLOR.credito} strokeOpacity={0.25} isAnimationActive={false} radius={conSeguro ? undefined : [3, 3, 0, 0]} />
            {conSeguro && <Bar dataKey="seguro" stackId="c" fill="var(--barra)" isAnimationActive={false} radius={[3, 3, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <VerTabla>
        <table className="my-1 w-full border-collapse">
          <thead>
            <tr className="text-suave">
              <th className="py-1 text-left font-semibold">Año</th>
              <th className="py-1 text-right font-semibold">Capital</th>
              <th className="py-1 text-right font-semibold">Interés</th>
              {conSeguro && <th className="py-1 text-right font-semibold">Seguro</th>}
              <th className="py-1 text-right font-semibold">Saldo al final</th>
            </tr>
          </thead>
          <tbody>
            {anios.map((a) => (
              <tr key={a.anio} className={`border-t border-borde ${a.anio === anioActual ? "font-semibold" : ""}`}>
                <td className="py-1">{a.anio}</td>
                <td className="num py-1">{UI_CORTA(a.capital)}</td>
                <td className="num py-1">{UI_CORTA(a.interes)}</td>
                {conSeguro && <td className="num py-1">{UI_CORTA(a.seguro)}</td>}
                <td className="num py-1">{UI_CORTA(a.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VerTabla>
    </Tarjeta>
  );
}

// ---------- UI frente al dólar ----------

// ui y dolar: índice, el día del préstamo = 100
export type PuntoIndice = { fecha: string; ui: number; dolar: number };

export function GraficoUiDolar({ puntos }: { puntos: PuntoIndice[] }) {
  const datos = puntos.map((p) => ({ ...p, t: Date.parse(p.fecha) }));
  const ultimo = puntos.at(-1)!;
  const inicio = puntos[0];
  // Una marca por año, también en los años sin puntos (entre el préstamo y el primer mes cargado)
  const desde = Number(puntos[0].fecha.slice(0, 4)), hasta = Number(ultimo.fecha.slice(0, 4));
  const anios = Array.from({ length: hasta - desde + 1 }, (_, i) => Date.parse(`${desde + i}-01-01`)).filter((t) => t >= datos[0].t);
  const nombreInicio = corto(inicio.fecha.slice(0, 7));

  return (
    <Tarjeta
      titulo={`UI vs. dólar desde ${inicio.fecha.slice(0, 4)}`}
      subtitulo={`Índice, ${nombreInicio} = 100.${ultimo.ui > ultimo.dolar ? " Por eso en dólares la deuda crece." : ""}`}
    >
      <div className="mt-2 flex flex-wrap gap-x-4 text-xs text-suave">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 rounded" style={{ background: COLOR.credito }} />
          UI <b className="text-texto">{entero(ultimo.ui)}</b>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 rounded" style={{ background: "var(--suave)" }} />
          Dólar <b className="text-texto">{entero(ultimo.dolar)}</b>
        </span>
      </div>
      <div className="mt-2 h-52" role="img" aria-label={`Gráfico de la UI y el dólar desde ${nombreInicio}: hoy la UI está en ${entero(ultimo.ui)} y el dólar en ${entero(ultimo.dolar)}; los mismos datos están en la tabla`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--grilla)" />
            <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} ticks={anios} tickFormatter={(t: number) => `'${String(new Date(t).getUTCFullYear()).slice(2)}`} {...ejes} />
            <YAxis {...ejes} axisLine={false} width={36} domain={["auto", "auto"]} tickFormatter={entero} />
            <Tooltip
              cursor={{ stroke: "var(--eje)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as (typeof datos)[number] | undefined;
                if (!active || !d) return null;
                return (
                  <CajaTooltip
                    titulo={corto(d.fecha.slice(0, 7))}
                    filas={[
                      { color: COLOR.credito, nombre: "UI", valor: entero(d.ui) },
                      { color: "var(--suave)", nombre: "Dólar", valor: entero(d.dolar) },
                    ]}
                  />
                );
              }}
            />
            <Line dataKey="ui" stroke={COLOR.credito} strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line dataKey="dolar" stroke="var(--suave)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <VerTabla>
        <table className="my-1 w-full border-collapse">
          <thead>
            <tr className="text-suave">
              <th className="py-1 text-left font-semibold">Fecha</th>
              <th className="py-1 text-right font-semibold">UI</th>
              <th className="py-1 text-right font-semibold">Dólar</th>
            </tr>
          </thead>
          <tbody>
            {[...puntos].reverse().map((p) => (
              <tr key={p.fecha} className="border-t border-borde">
                <td className="py-1">{corto(p.fecha.slice(0, 7))}</td>
                <td className="num py-1">{entero(p.ui)}</td>
                <td className="num py-1">{entero(p.dolar)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VerTabla>
    </Tarjeta>
  );
}

// ---------- Débito mensual en pesos ----------

export type PuntoDebito = { periodo: string; total: number; real: boolean; cuota: number | null };

export function GraficoDebitos({ puntos }: { puntos: PuntoDebito[] }) {
  if (puntos.length < 2) return null;
  const ultimo = puntos.at(-1)!.periodo;
  const hayEstimados = puntos.some((p) => !p.real);
  return (
    <Tarjeta titulo="Débito mensual en pesos" subtitulo="Desde cero, para ver el aumento en su tamaño real. La lista de todos los débitos está abajo.">
      {hayEstimados && (
        <Leyenda
          items={[
            { color: COLOR.credito, texto: "según estado de cuenta" },
            { color: COLOR.credito, texto: "estimado con la UI", forma: "hueco" },
          ]}
        />
      )}
      <div className="mt-2 h-48" role="img" aria-label={`Gráfico del débito del préstamo en pesos, de ${corto(puntos[0].periodo)} a ${corto(ultimo)}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={puntos} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke="var(--grilla)" />
            <XAxis dataKey="periodo" tickFormatter={corto} {...ejes} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tickFormatter={miles} {...ejes} axisLine={false} width={56} domain={[0, "auto"]} />
            <Tooltip
              cursor={{ fill: "var(--tarjeta)" }}
              content={({ active, payload }) => {
                const d = payload?.[0]?.payload as PuntoDebito | undefined;
                if (!active || !d) return null;
                return (
                  <CajaTooltip
                    titulo={`${corto(d.periodo)}${d.cuota ? ` · cuota Nº ${d.cuota}` : ""}`}
                    filas={[{ color: COLOR.credito, nombre: d.real ? "Débito" : "Débito estimado", valor: `${d.real ? "" : "≈ "}${pesos(d.total)}` }]}
                  />
                );
              }}
            />
            <Bar dataKey="total" maxBarSize={20} radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {puntos.map((p) => (
                <Cell
                  key={p.periodo}
                  fill={p.real ? COLOR.credito : "var(--fondo)"}
                  fillOpacity={p.real ? (p.periodo === ultimo ? 1 : 0.55) : 1}
                  stroke={p.real ? undefined : COLOR.credito}
                  strokeWidth={p.real ? 0 : 1.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Tarjeta>
  );
}
