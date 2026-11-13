// Íconos de las fichas, dibujados en SVG (16 px, trazo del color que se les pase). El color es el
// del dato que representan (Visa azul, préstamo violeta, cuentas amarillo…), nunca uno de adorno.

import type { ReactNode } from "react";

function Svg({ children, color, className = "" }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      style={color ? { color } : undefined}
    >
      {children}
    </svg>
  );
}

type Props = { color?: string; className?: string };

// Recibo de sueldo: una hoja con renglones
export const IconoRecibo = (p: Props) => (
  <Svg {...p}>
    <path d="M4 1.75h5.5L12.5 4.75v9.5H4z" />
    <path d="M6.25 7.5h4M6.25 10h4M6.25 5h1.5" />
  </Svg>
);

export const IconoTarjeta = (p: Props) => (
  <Svg {...p}>
    <rect x="1.75" y="3.5" width="12.5" height="9" rx="1.5" />
    <path d="M1.75 6.5h12.5M4.25 10h2.5" />
  </Svg>
);

export const IconoCasa = (p: Props) => (
  <Svg {...p}>
    <path d="M2.25 7.25 8 2.5l5.75 4.75" />
    <path d="M3.75 6v7.5h8.5V6" />
    <path d="M6.75 13.5v-3.5h2.5v3.5" />
  </Svg>
);

// Préstamo: un banco (columnas)
export const IconoBanco = (p: Props) => (
  <Svg {...p}>
    <path d="M2 6 8 2.75 14 6" />
    <path d="M2.75 6.25h10.5" />
    <path d="M4.25 7.25v4.5M8 7.25v4.5M11.75 7.25v4.5" />
    <path d="M2 13.25h12" />
  </Svg>
);

// UTE: un rayo
export const IconoLuz = (p: Props) => (
  <Svg {...p}>
    <path d="M9 1.75 3.75 9h4l-1 5.25L12.25 7h-4z" />
  </Svg>
);

// Antel fijo: ondas de internet
export const IconoInternet = (p: Props) => (
  <Svg {...p}>
    <path d="M1.75 6.25a9 9 0 0 1 12.5 0M3.9 8.6a6 6 0 0 1 8.2 0M6 10.9a3 3 0 0 1 4 0" />
    <circle cx="8" cy="13" r="0.6" fill="currentColor" />
  </Svg>
);

export const IconoCelular = (p: Props) => (
  <Svg {...p}>
    <rect x="4.5" y="1.75" width="7" height="12.5" rx="1.5" />
    <path d="M7.25 11.75h1.5" />
  </Svg>
);

export const IconoCalendario = (p: Props) => (
  <Svg {...p}>
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M5.25 1.75v2.5M10.75 1.75v2.5" />
  </Svg>
);

export const IconoTilde = (p: Props) => (
  <Svg {...p}>
    <path d="m3.5 8.25 3 3 6-6.5" />
  </Svg>
);

// Menú: estadísticas (barras) y configuración (perillas)
export const IconoBarras = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 13.5v-5M6.17 13.5v-9M9.83 13.5v-6M13.5 13.5V2.5" />
  </Svg>
);

export const IconoAjustes = (p: Props) => (
  <Svg {...p}>
    <path d="M2.5 4.5h6m3 0h2M2.5 8h2m3 0h6M2.5 11.5h8m3 0h0" />
    <path d="M10 3v3M6 6.5v3M12 10v3" />
  </Svg>
);

// Alquiler que pagás: una llave
export const IconoLlave = (p: Props) => (
  <Svg {...p}>
    <circle cx="5.25" cy="10.75" r="3" />
    <path d="m7.4 8.6 6.1-6.1M11.25 4.75l1.75 1.75M9.75 6.25l1.25 1.25" />
  </Svg>
);

// Ingresos (entra) y gastos (sale): una flecha hacia una bandeja, o saliendo de ella
export const IconoEntra = (p: Props) => (
  <Svg {...p}>
    <path d="M8 1.75v7.5M5 6.5 8 9.5l3-3" />
    <path d="M2.25 10v3.25h11.5V10" />
  </Svg>
);

export const IconoSale = (p: Props) => (
  <Svg {...p}>
    <path d="M8 9.75v-7.5M5 5.25 8 2.25l3 3" />
    <path d="M2.25 10v3.25h11.5V10" />
  </Svg>
);

// Resumen: cuatro cuadros
export const IconoResumen = (p: Props) => (
  <Svg {...p}>
    <rect x="2" y="2" width="5" height="5" rx="1" />
    <rect x="9" y="2" width="5" height="5" rx="1" />
    <rect x="2" y="9" width="5" height="5" rx="1" />
    <rect x="9" y="9" width="5" height="5" rx="1" />
  </Svg>
);

// Más (pestañas del celular): tres puntos
export const IconoMas = (p: Props) => (
  <Svg {...p}>
    <circle cx="3.5" cy="8" r="0.9" fill="currentColor" />
    <circle cx="8" cy="8" r="0.9" fill="currentColor" />
    <circle cx="12.5" cy="8" r="0.9" fill="currentColor" />
  </Svg>
);
