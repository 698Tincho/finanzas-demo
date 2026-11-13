// Mientras llegan los datos de una página: el esqueleto del reporte, con el menú ya visible

const bloque = "rounded-2xl bg-tarjeta motion-safe:animate-pulse";

export default function Cargando() {
  return (
    <main aria-busy="true" aria-label="Cargando">
      <div className={`h-8 w-48 ${bloque}`} />
      <div className={`mt-2 h-4 w-32 ${bloque}`} />
      {[0, 1, 2].map((fila) => (
        <div key={fila} className="mt-6 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => <div key={i} className={`h-20 ${bloque}`} />)}
        </div>
      ))}
      <div className={`mt-9 h-64 ${bloque}`} />
    </main>
  );
}
