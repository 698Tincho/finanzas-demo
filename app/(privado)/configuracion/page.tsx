// Configuración: lo que no llega por mail y se carga a mano, una vez. Los dos alquileres valen
// desde el mes que elijas (un cambio no toca los meses anteriores). Abajo, las cuentas de la casa,
// que se leen solas de los mails de confirmación del banco.

import type { Metadata } from "next";
import { COLORES } from "@/components/reparto";
import { CUENTAS, cuentasFaltantes } from "@/components/resumen";
import { TarjetaAlquiler } from "@/components/tarjeta-alquiler";
import { ComoSeCalcula, Nota, PuntoColor, Seccion, Tabla, Td, Th } from "@/components/ui";
import { diaMes, pesos } from "@/lib/formato";
import { leerConfig, leerSerie, type Cuenta } from "@/lib/modelo";

export const metadata: Metadata = { title: "Configuración · Finanzas" };

const MESES = ["", "enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];
// "2026-10" + 1 -> "2026-11"
const sumarMes = (p: string, k: number) => {
  const i = Number(p.slice(0, 4)) * 12 + Number(p.slice(5, 7)) - 1 + k;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
};

export default async function Configuracion() {
  const [config, serie] = await Promise.all([leerConfig(), leerSerie()]);
  // El mes actual, y para "Desde": el que viene (un aumento cargado por adelantado), este y los
  // anteriores hasta el primero con datos (o dos años, si no hay datos)
  const ahora = new Date();
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}`;
  const primero = serie[0]?.periodo ?? sumarMes(hoy, -24);
  const meses: string[] = [];
  for (let p = sumarMes(hoy, 1); p >= primero; p = sumarMes(p, -1)) meses.push(p);

  return (
    <main>
      <h1 className="text-2xl font-bold">Configuración</h1>
      <p className="mt-1 max-w-prose text-sm text-suave">Lo que no llega por mail: lo cargás una vez y vale desde el mes que elijas.</p>

      <Seccion titulo="Alquileres">
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <TarjetaAlquiler
            tipo="cobras"
            titulo="Alquiler que cobrás"
            efecto="Se suma al ingreso del mes"
            ayudaCero="Si un mes no cobrás (por ejemplo, sin inquilino), cargá $ 0 desde ese mes."
            valores={config.cobras}
            hoy={hoy}
            meses={meses}
          />
          <TarjetaAlquiler
            tipo="pagas"
            titulo="Alquiler que pagás"
            efecto="Se resta en “Te quedó”"
            ayudaCero="Si dejás de pagarlo, cargá $ 0 desde ese mes."
            color={COLORES.alquiler}
            valores={config.pagas}
            hoy={hoy}
            meses={meses}
          />
        </div>
        <ComoSeCalcula>
          <p>
            Te quedó = sueldo en pesos + ticket + alquiler que cobrás − tarjetas en pesos − préstamo − alquiler que pagás −
            cuentas de la casa. No cuenta los dólares.
          </p>
          <p>Cada monto vale desde su mes hasta el próximo cambio. Los reportes de los meses anteriores no cambian.</p>
        </ComoSeCalcula>
      </Seccion>

      <CuentasDeLaCasa serie={serie} />
    </main>
  );
}

// El último pago de cada cuenta. Si el último mes cargado no tiene el de una cuenta que se pagaba,
// se avisa que falta.
function CuentasDeLaCasa({ serie }: { serie: Awaited<ReturnType<typeof leerSerie>> }) {
  const ultimo = serie.at(-1);
  const faltan = ultimo ? cuentasFaltantes(serie, ultimo.periodo) : [];
  const filas = (Object.keys(CUENTAS) as Cuenta[]).map((k) => {
    const mes = serie.findLast((p) => p.pagos.some((x) => x.cuenta === k));
    return { k, pago: mes?.pagos.findLast((x) => x.cuenta === k), falta: faltan.includes(k) };
  });

  return (
    <Seccion titulo="Cuentas de la casa">
      <p className="max-w-prose text-sm text-suave">
        Se leen solas de los mails de confirmación del banco cuando pagás UTE, Antel fijo o Antel Móvil. No hay que cargar nada.
      </p>
      <Tabla>
        <thead>
          <tr>
            <Th>Cuenta</Th>
            <Th>Último pago</Th>
            <Th derecha>Monto</Th>
          </tr>
        </thead>
        <tbody>
          {filas.map(({ k, pago, falta }) => (
            <tr key={k}>
              <Td>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <PuntoColor color={COLORES.cuentas} className="size-2" />
                  {CUENTAS[k]}
                </span>
              </Td>
              <Td className="text-suave">
                {pago ? (
                  <>
                    {diaMes(pago.fecha)}
                    {falta && ultimo && <span className="block text-xs">falta el de {MESES[Number(ultimo.periodo.slice(5, 7))]}</span>}
                  </>
                ) : (
                  "Todavía no llegó ningún pago"
                )}
              </Td>
              <Td num>{pago ? pesos(pago.monto) : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      {filas.every((f) => !f.pago) && (
        <Nota>
          Cuando pagues desde el banco, el pipeline encuentra el mail de confirmación y el pago aparece acá y en el reporte del mes.
        </Nota>
      )}
      <ComoSeCalcula titulo="De dónde salen">
        <p>
          El pipeline busca en tu Gmail las confirmaciones de pago del banco de UTE, ANTEL fijo y ANTEL Móvil y toma el monto pagado. El pago
          cuenta en el mes en que lo hiciste.
        </p>
        <p>Una cuenta se espera si la pagaste alguno de los dos meses anteriores: si ese mes no llegó el pago, el reporte avisa que falta.</p>
      </ComoSeCalcula>
    </Seccion>
  );
}
