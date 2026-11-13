// Tarjetas por año, en /tarjetas: promedio por mes de cada tarjeta y de los dólares, para comparar
// años incompletos con completos. Cada banco se promedia sobre los meses con su estado de cuenta.

import type { PuntoSerie } from "@/lib/modelo";
import { BANCO, dolares, pesos } from "@/lib/formato";
import { Nota, Seccion, Tabla, Td, Th } from "./ui";

export function TarjetasPorAnio({ serie }: { serie: PuntoSerie[] }) {
  const anios = [...new Set(serie.map((p) => p.periodo.slice(0, 4)))].reverse();
  const promedio = (l: number[]) => (l.length ? l.reduce((s, x) => s + x, 0) / l.length : null);
  const filas = anios.map((anio) => {
    const meses = serie.filter((p) => p.periodo.startsWith(anio));
    const de = (b: string) => meses.flatMap((p) => p.tarjetas.filter((t) => t.banco === b).map((t) => t.uyu));
    const conEstados = meses.filter((p) => p.tarjetas.length);
    return {
      anio,
      meses: conEstados.length,
      visa: promedio(de("visa")),
      master: promedio(de("master")),
      usd: promedio(conEstados.map((p) => p.tarjetas.reduce((s, t) => s + t.usd, 0))),
    };
  }).filter((f) => f.meses > 0);
  // Meses con un solo estado: ese banco no entra en el promedio de ese mes
  const incompletos = serie.filter((p) => p.tarjetas.length && p.tarjetas.length < Object.keys(BANCO).length);

  if (!filas.length) return null;
  return (
    <Seccion titulo="Tarjetas por año">
      <Nota>Promedio por mes, para poder comparar años que no están completos.</Nota>
      <Tabla>
        <thead>
          <tr>
            <Th>Año</Th>
            <Th derecha>Visa</Th>
            <Th derecha>Mastercard</Th>
            <Th derecha>Dólares</Th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.anio}>
              <Td>
                <span className="font-semibold">{f.anio}</span>
                <div className="text-xs text-suave">
                  {f.meses} {f.meses === 1 ? "mes" : "meses"}
                </div>
              </Td>
              <Td num>{f.visa == null ? "—" : pesos(f.visa)}</Td>
              <Td num>{f.master == null ? "—" : pesos(f.master)}</Td>
              <Td num className="text-suave">{f.usd == null ? "—" : dolares(f.usd)}</Td>
            </tr>
          ))}
        </tbody>
      </Tabla>
      {incompletos.length > 0 && (
        <Nota>
          {incompletos.length === 1 ? `${incompletos[0].nombre} tiene` : `${incompletos.length} meses tienen`} un solo estado de cuenta: el banco que
          falta no se cuenta como cero.
        </Nota>
      )}
    </Seccion>
  );
}
