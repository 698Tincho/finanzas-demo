// Costo neto del préstamo, en /prestamo: el débito del mes menos el alquiler que cobrás ese mes
// (de /configuracion). Responde cuánto te cuesta de verdad el préstamo, como una cuenta en tres
// recuadros: débito − alquiler que cobrás = te costó (el violeta, el recuadro teñido de la
// credito). Debajo, el promedio de los últimos 12 meses con sus barras y la tabla. Si el alquiler
// pasa el débito, se dice cuánto sobra en vez de un costo negativo.

import Link from "next/link";
import { VerTabla } from "./graficos";
import type { Config, PuntoSerie } from "@/lib/modelo";
import { pesos } from "@/lib/formato";
import { COLORES } from "./reparto";
import { mesSolo, pctEntero, valorEn } from "./resumen";
import { IconoBanco, IconoCasa, IconoEntra } from "./iconos";
import { MicroBarras } from "./micro-barras";
import { Barra, ComoSeCalcula, Ficha, Nota, Seccion } from "./ui";

// El signo entre dos recuadros de la cuenta (− o =): al costado en la compu, entre medio en el celular
function Operador({ signo }: { signo: string }) {
  return (
    <div aria-hidden className="flex items-center justify-center text-xl font-semibold text-suave sm:px-1">
      {signo}
    </div>
  );
}

// "2026-10" -> "oct 26" (corto de graficos.tsx no se puede llamar desde acá: ese módulo es del cliente)
const MES_CORTO = ["", "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];
const corto = (p: string) => `${MES_CORTO[Number(p.slice(5, 7))]} ${p.slice(2, 4)}`;

// debitos: los meses con débito del préstamo, del más viejo al más nuevo
export function CostoNeto({ debitos, config }: { debitos: PuntoSerie[]; config: Config }) {
  const ultimo = debitos.at(-1);
  if (!ultimo?.credito) return null;
  if (!config.cobras.some((v) => v.desde <= ultimo.periodo)) {
    return (
      <Seccion titulo="Costo neto">
        <Nota>
          Si cobrás un alquiler, cargalo en{" "}
          <Link href="/configuracion" className="font-semibold text-link hover:underline">
            Configuración
          </Link>{" "}
          y acá vas a ver cuánto te cuesta de verdad el préstamo: el débito menos lo que cobrás.
        </Nota>
      </Seccion>
    );
  }

  const neto = (p: PuntoSerie) => p.credito!.total - valorEn(config.cobras, p.periodo);
  const debito = ultimo.credito.total;
  const alquiler = valorEn(config.cobras, ultimo.periodo);
  const delMes = neto(ultimo);
  const cubre = Math.min(1, alquiler / debito);
  const aprox = ultimo.credito.real ? "" : "≈ ";
  // Promedio de los últimos 12 débitos, cada uno con el alquiler de su mes
  const ultimos = debitos.slice(-12);
  const promedio = ultimos.reduce((s, p) => s + neto(p), 0) / ultimos.length;
  const promedioAprox = ultimos.some((p) => !p.credito!.real) ? "≈ " : "";
  // Meses del promedio de antes del primer alquiler cargado: cuentan el débito entero
  const desdePrimero = [...config.cobras].sort((a, b) => a.desde.localeCompare(b.desde))[0].desde;
  const sinAlquiler = ultimos.filter((p) => p.periodo < desdePrimero).length;
  const primerAlquiler = ultimos.find((p) => p.periodo >= desdePrimero) ?? ultimo;

  return (
    <Seccion titulo="Costo neto">
      <Nota>Lo que te cuesta de verdad el préstamo: el débito menos el alquiler que cobrás.</Nota>
      {/* La cuenta, de izquierda a derecha (en el celular, de arriba abajo): débito − alquiler = costo */}
      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Ficha
          icono={<IconoBanco color={COLORES.credito} />}
          titulo={`Débito de ${mesSolo(ultimo.nombre)}`}
          valor={`${aprox}${pesos(debito)}`}
          pie={{ izquierda: ultimo.credito.real ? "del estado de cuenta" : "estimado con la UI" }}
        />
        <Operador signo="−" />
        <Ficha
          icono={<IconoEntra />}
          titulo="Alquiler que cobrás"
          valor={pesos(alquiler)}
          detalle={`cubre ${pctEntero(cubre)} del débito`}
          pie={{ izquierda: "de Configuración" }}
        >
          <Barra fraccion={cubre} color="var(--texto)" />
        </Ficha>
        <Operador signo="=" />
        <Ficha
          tono="credito"
          icono={<IconoCasa />}
          titulo={delMes >= 0 ? `Te costó en ${mesSolo(ultimo.nombre)}` : `Te sobró en ${mesSolo(ultimo.nombre)}`}
          valor={`${aprox}${pesos(Math.abs(delMes))}`}
          detalle={delMes >= 0 ? "lo que ponés vos" : "el alquiler pasa el débito"}
          pie={{ izquierda: delMes >= 0 ? `${pctEntero(1 - cubre)} del débito` : "no te cuesta nada" }}
        />
      </div>

      {/* Los últimos 12 meses: el promedio, cómo vino cada mes (barras chicas) y la tabla */}
      <div className="superficie mt-2 p-4">
        <div className="text-xs text-suave">
          {promedio >= 0 ? "En promedio te costó" : "En promedio te sobró"}, {ultimos.length === 1 ? "el último mes" : `los últimos ${ultimos.length} meses`}
        </div>
        <div className="cifra text-xl">
          {promedioAprox}
          {pesos(Math.abs(promedio))} <span className="text-sm font-normal text-suave">por mes</span>
        </div>
        <div className="mb-3 text-xs text-suave">cada mes con el alquiler de ese mes</div>
        <MicroBarras
          valores={ultimos.map(neto)}
          color="var(--serie-credito)"
          etiqueta="Lo que te costó (o te sobró) el préstamo cada uno de los últimos meses; los números están en la tabla"
        />
        {ultimos.some((p) => neto(p) < 0) && (
          <p className="mt-1.5 text-xs text-suave">Violeta para arriba: lo que pusiste. Gris para abajo: lo que sobró del alquiler.</p>
        )}
      <VerTabla>
        <table className="my-1 w-full border-collapse">
          <thead>
            <tr className="text-suave">
              <th className="py-1 text-left font-semibold">Mes</th>
              <th className="py-1 text-right font-semibold">Débito</th>
              <th className="py-1 text-right font-semibold">Alquiler</th>
              <th className="py-1 text-right font-semibold">Neto</th>
            </tr>
          </thead>
          <tbody>
            {[...ultimos].reverse().map((p) => {
              const n = neto(p);
              const conAlquiler = config.cobras.some((v) => v.desde <= p.periodo);
              const estimado = p.credito!.real ? "" : "≈ ";
              return (
                <tr key={p.periodo} className="border-t border-borde">
                  <td className="py-1">
                    <Link href={`/mes/${p.periodo}`} className="text-link hover:underline">
                      {corto(p.periodo)}
                    </Link>
                  </td>
                  <td className="num py-1">
                    {estimado}
                    {pesos(p.credito!.total)}
                  </td>
                  <td className="num py-1">{conAlquiler ? pesos(valorEn(config.cobras, p.periodo)) : <span className="text-suave">sin cargar</span>}</td>
                  <td className="num py-1 font-semibold">{n >= 0 ? `${estimado}${pesos(n)}` : <Sobra monto={-n} />}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-borde">
              <td className="py-1 font-semibold">Promedio</td>
              <td />
              <td />
              <td className="num py-1 font-semibold">{promedio >= 0 ? `${promedioAprox}${pesos(promedio)}` : <Sobra monto={-promedio} />}</td>
            </tr>
          </tfoot>
        </table>
        {ultimos.some((p) => neto(p) < 0) && <p className="mt-1 text-suave sm:hidden">Neto con −: el alquiler pasó el débito y te sobró.</p>}
      </VerTabla>
      </div>
      {sinAlquiler > 0 && (
        <Nota>
          Antes de {mesSolo(primerAlquiler.nombre)} {primerAlquiler.periodo.slice(0, 4)} no hay alquiler cargado: {sinAlquiler === 1 ? "ese mes cuenta" : `esos ${sinAlquiler} meses cuentan`} el débito
          entero. Si ya lo cobrabas, cargalo en{" "}
          <Link href="/configuracion" className="font-semibold text-link hover:underline">
            Configuración
          </Link>{" "}
          desde el mes en que empezó.
        </Nota>
      )}
      <ComoSeCalcula>
        <p>Costo neto = débito del préstamo del mes − el alquiler que cobrás ese mes (de Configuración).</p>
        <p>
          No cuenta lo que el alquiler paga de impuestos (IRPF, contribución) ni los meses sin inquilino: para eso, cargá el
          monto neto o $ 0 en Configuración.
        </p>
        {(aprox || promedioAprox) && <p>Lo que lleva ≈ usa un débito estimado: todavía no está el estado de la cuenta del banco.</p>}
      </ComoSeCalcula>
    </Seccion>
  );
}

// Lo que sobra cuando el alquiler pasa el débito: "sobran $ 3.017"; en el celular, donde no entra,
// "−$ 3.017" (con una nota debajo de la tabla)
function Sobra({ monto }: { monto: number }) {
  return (
    <span className="font-normal">
      <span className="hidden sm:inline">sobran {pesos(monto)}</span>
      <span className="sm:hidden">{pesos(-monto)}</span>
    </span>
  );
}
