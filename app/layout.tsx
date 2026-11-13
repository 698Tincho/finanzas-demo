import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIE_TEMA, temaDe } from "@/lib/tema";
import "./globals.css";

// Una sola familia; el eje de ancho (wdth) da las cifras angostas de .cifra (globals.css)
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Finanzas · demo",
  description: "Demo de un dashboard de finanzas personales: sueldo, tarjetas y préstamo, mes a mes, con datos inventados.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const tema = temaDe((await cookies()).get(COOKIE_TEMA)?.value);
  return (
    <html lang="es" data-theme={tema} className={`${archivo.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
