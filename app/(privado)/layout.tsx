// Las páginas del dashboard. En el original, todo lo que está en (privado) necesita sesión; en el
// demo no hay usuarios, y arriba de cada página va el aviso de que los datos son inventados.

import { Menu, type GrupoMeses } from "@/components/menu";
import { faltanEnMes, quedoEnMes } from "@/components/resumen";
import { leerConfig, leerSerie } from "@/lib/modelo";
import { REPO } from "@/lib/demo";
import { COOKIE_TEMA, temaDe } from "@/lib/tema";
import { cookies } from "next/headers";

export default async function LayoutPrivado({ children }: LayoutProps<"/">) {
  // Reportes mensuales para el menú: del año más nuevo al más viejo, y dentro de cada año
  // del mes más nuevo al más viejo
  const grupos: GrupoMeses[] = [];
  const [serie, config] = await Promise.all([leerSerie(), leerConfig()]);
  for (const p of [...serie].reverse()) {
    const anio = p.periodo.slice(0, 4);
    if (grupos.at(-1)?.anio !== anio) grupos.push({ anio, meses: [] });
    grupos.at(-1)!.meses.push({ periodo: p.periodo, nombre: p.nombre, completo: quedoEnMes(p, { serie, config }) != null, falta: faltanEnMes(p, serie) });
  }

  return (
    <div className="lg:flex">
      <Menu grupos={grupos} tema={temaDe((await cookies()).get(COOKIE_TEMA)?.value)} />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-3xl px-4 pt-6 pb-28 sm:px-6 lg:pt-10 lg:pb-16">
          <AvisoDemo />
          {children}
        </div>
      </div>
    </div>
  );
}

function AvisoDemo() {
  return (
    <p className="superficie mb-6 px-4 py-3 text-sm text-suave">
      <span className="font-semibold text-texto">Demo con datos inventados.</span> El original junta automáticamente los recibos de
      sueldo, los estados de cuenta y los pagos de la casa, y los muestra acá cada mes.{" "}
      <a href={REPO} className="font-semibold text-link hover:underline">
        Ver el código
      </a>
    </p>
  );
}
