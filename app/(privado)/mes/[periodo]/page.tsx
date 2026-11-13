// Página de un mes: el reporte completo, igual que el mail

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetalleMes } from "@/components/detalle";
import { Tablero } from "@/components/tablero";
import { Seccion } from "@/components/ui";
import { ResumenMes } from "@/components/resumen";
import { SeccionesMes } from "@/components/secciones-mes";
import { SelectorMes } from "@/components/selector-mes";
import { leerConfig, leerMes, leerSerie } from "@/lib/modelo";

export async function generateMetadata({ params }: PageProps<"/mes/[periodo]">): Promise<Metadata> {
  const { periodo } = await params;
  return { title: `${(await leerMes(periodo))?.nombre ?? "Mes"} · Finanzas` };
}

export default async function PaginaMes({ params }: PageProps<"/mes/[periodo]">) {
  const { periodo } = await params;
  const [mes, serie, config] = await Promise.all([leerMes(periodo), leerSerie(), leerConfig()]);
  if (!mes) notFound();
  const anterior = serie[serie.findIndex((p) => p.periodo === periodo) - 1];

  return (
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{mes.nombre}</h1>
        <SelectorMes actual={periodo} meses={serie.map(({ periodo, nombre }) => ({ periodo, nombre }))} />
      </div>
      <ResumenMes mes={mes} anterior={anterior} serie={serie} config={config} />
      <Seccion titulo="Tablero del mes" id="que-llego">
        <Tablero mes={mes} serie={serie} config={config} enReporte />
      </Seccion>
      <SeccionesMes mes={mes} />
      <DetalleMes mes={mes} anterior={anterior} serie={serie} config={config} />
    </main>
  );
}
