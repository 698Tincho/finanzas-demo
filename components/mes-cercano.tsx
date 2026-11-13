"use client";

// En "No hay reporte de ese mes": el mes cargado más cercano al de la dirección (si es un mes válido)

import Link from "next/link";
import { usePathname } from "next/navigation";

type Opcion = { periodo: string; nombre: string };

const indice = (p: string) => Number(p.slice(0, 4)) * 12 + Number(p.slice(5, 7));

export function MesCercano({ meses }: { meses: Opcion[] }) {
  const pedido = usePathname().match(/^\/mes\/(\d{4}-(0[1-9]|1[0-2]))$/)?.[1];
  if (!pedido || !meses.length) return null;
  const cercano = meses.reduce((a, b) => (Math.abs(indice(b.periodo) - indice(pedido)) < Math.abs(indice(a.periodo) - indice(pedido)) ? b : a));
  return (
    <Link href={`/mes/${cercano.periodo}`} className="font-semibold text-link hover:underline">
      Ver {cercano.nombre}, el más cercano
    </Link>
  );
}
