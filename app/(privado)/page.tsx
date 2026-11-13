// Resumen (el inicio): el ingreso por mes, lo que te queda y a dónde va, y la tira "Mes a mes".
// Cada tema tiene su página (Ingresos, Gastos, Tarjetas, Préstamo, Cuentas de la casa) y cada mes
// su reporte.

import { CifrasResumen, type Reparto } from "@/components/cifras-resumen";
import { IconoBarras, IconoResumen } from "@/components/iconos";
import { Tablero } from "@/components/tablero";
import { TusFinanzas } from "@/components/tus-finanzas";
import { MesAMes, type ColumnaMes } from "@/components/mes-a-mes";
import { faltanEnMes, ingresoEnMes, mesSolo, quedoEnMes, totalCuentas, valorEn, type Contexto } from "@/components/resumen";
import { ComoSeCalcula, MarcaGuardia } from "@/components/ui";
import { dolares } from "@/lib/formato";
import { leerConfig, leerMes, leerSerie, type PuntoSerie } from "@/lib/modelo";

const promedio = (lista: number[]) => (lista.length ? lista.reduce((s, x) => s + x, 0) / lista.length : null);

// Promedios de una ventana de meses. El reparto, sobre los meses con todos los datos (recibo,
// estados y cuentas de la casa); lo que te queda (ingreso − tarjetas en pesos − préstamo −
// alquiler que pagás − cuentas) sale de ahí: sin los dólares y sin otros gastos de la cuenta.
function promedios(meses: PuntoSerie[], ctx: Contexto) {
  const conSueldo = meses.filter((m) => m.sueldo);
  const conTarjetas = meses.filter((m) => m.tarjetas.length);
  const completos = meses.filter((m) => quedoEnMes(m, ctx) != null);
  const banco = (m: PuntoSerie, b: string) => m.tarjetas.find((t) => t.banco === b)?.uyu ?? 0;
  // Para la barra del sueldo: promedio de cada parte sobre los mismos meses, así las partes suman
  const reparto: Reparto | null = completos.length
    ? {
        cobrado: promedio(completos.map((m) => ingresoEnMes(m, ctx.config)!))!,
        alquilerCobrado: promedio(completos.map((m) => valorEn(ctx.config.cobras, m.periodo)))!,
        visa: promedio(completos.map((m) => banco(m, "visa")))!,
        master: promedio(completos.map((m) => banco(m, "master")))!,
        credito: promedio(completos.map((m) => m.credito?.total ?? 0))!,
        alquiler: promedio(completos.map((m) => valorEn(ctx.config.pagas, m.periodo)))!,
        cuentas: promedio(completos.map((m) => totalCuentas(m.pagos)))!,
      }
    : null;
  return {
    reparto,
    tarjetasUsd: promedio(conTarjetas.map((m) => m.tarjetas.reduce((s, t) => s + t.usd, 0))),
    guardias: conSueldo.filter((m) => m.guardia).length,
    conSueldo: conSueldo.length,
    completos: completos.length,
  };
}

export default async function Estadisticas() {
  const [serie, config] = await Promise.all([leerSerie(), leerConfig()]);
  const ctx: Contexto = { serie, config };
  if (!serie.length) {
    return (
      <main>
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="mt-2 max-w-prose text-sm">Todavía no hay meses cargados.</p>
        <p className="mt-2 max-w-prose text-sm text-suave">
          Los manda el pipeline cada vez que corre en tu Mac. Para mandarlos ahora, desde la carpeta del
          proyecto: <code className="rounded bg-tarjeta px-1 py-0.5 text-texto">npm run dashboard:enviar</code>
        </p>
      </main>
    );
  }
  // Últimos 12 meses hasta el último con recibo de sueldo, y los 12 anteriores para comparar
  const ultimoPeriodo = serie.findLast((m) => m.sueldo)?.periodo ?? null;
  const fin = serie.findIndex((m) => m.periodo === ultimoPeriodo) + 1 || serie.length;
  const actual = promedios(serie.slice(Math.max(0, fin - 12), fin), ctx);
  const anterior = promedios(serie.slice(Math.max(0, fin - 24), Math.max(0, fin - 12)), ctx);
  const desde = serie[Math.max(0, fin - 12)]?.nombre, hasta = serie[fin - 1]?.nombre;
  const columnas: ColumnaMes[] = serie.slice(Math.max(0, fin - 12), fin).map((p) => {
    const tarjeta = (b: string) => p.tarjetas.find((t) => t.banco === b)?.uyu ?? null;
    return {
      periodo: p.periodo,
      nombre: p.nombre,
      ingreso: ingresoEnMes(p, config),
      visa: tarjeta("visa"),
      master: tarjeta("master"),
      credito: p.credito?.total ?? null,
      creditoReal: p.credito?.real ?? true,
      alquiler: config.pagas.some((v) => v.desde <= p.periodo) ? valorEn(config.pagas, p.periodo) : null,
      cuentas: p.pagos.length ? totalCuentas(p.pagos) : null,
      queda: quedoEnMes(p, ctx),
      guardia: p.guardia,
      falta: faltanEnMes(p, serie),
    };
  });

  // El tablero es del último mes cargado (aunque todavía le falten datos)
  const ultimoMes = await leerMes(serie.at(-1)!.periodo);

  return (
    <main>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-xs text-suave">
          Datos de ejemplo
        </p>
      </div>

      <section>
        <p className="mt-0.5 text-sm text-suave">Últimos 12 meses{desde && hasta ? ` (${desde} – ${hasta})` : ""}</p>
        {actual.reparto ? (
          <CifrasResumen
            reparto={actual.reparto}
            anterior={anterior.reparto}
            ingresos={columnas.map((c) => c.ingreso)}
            quedas={columnas.map((c) => c.queda)}
            extra={
              <>
                {actual.guardias > 0 && (
                  <div>
                    <MarcaGuardia texto={`guardia de retén en ${actual.guardias} de ${actual.conSueldo} meses`} />
                  </div>
                )}
              </>
            }
          />
        ) : (
          <p className="mt-6 text-sm text-suave">Faltan meses con recibo de sueldo, estados de cuenta y cuentas de la casa para armar el promedio.</p>
        )}
        {actual.tarjetasUsd ? (
          <p className="mt-3 text-xs text-suave">Las tarjetas también suman {dolares(actual.tarjetasUsd)} por mes en dólares.</p>
        ) : null}
        <ComoSeCalcula>
          <p>
            Te queda es el ingreso (sueldo en pesos + ticket alimentación + el alquiler que cobrás) menos las tarjetas
            en pesos, el préstamo, el alquiler que pagás y las cuentas de la casa. No cuenta los dólares ni otros
            gastos de la cuenta.
          </p>
          <p>Los alquileres salen de Configuración; las cuentas de la casa, de los mails de confirmación del banco.</p>
          <p>
            Los promedios son de los meses con todos los datos ({actual.completos} de los últimos 12); las flechas
            comparan con los 12 meses anteriores.
          </p>
        </ComoSeCalcula>
      </section>

      <TusFinanzas
        pestanias={[
          ...(ultimoMes
            ? [{ id: "tablero", texto: `Tablero de ${mesSolo(ultimoMes.nombre)}`, icono: <IconoResumen />, contenido: <Tablero mes={ultimoMes} serie={serie} config={config} /> }]
            : []),
          { id: "mes-a-mes", texto: "Mes a mes", icono: <IconoBarras />, contenido: <MesAMes meses={columnas} promedio={actual.reparto?.cobrado ?? 0} enPestania /> },
        ]}
      />
    </main>
  );
}
