"use client";

// Error inesperado en cualquier página (por ejemplo, la base de datos no responde).
// En producción Next no manda el mensaje real al navegador: solo un código para buscar en los logs.

export default function ErrorPagina({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main className="mx-auto max-w-sm px-4 pt-24 pb-16">
      <h1 className="text-2xl font-bold">No se pudieron cargar los datos</h1>
      <p className="mt-2 text-sm text-suave">
        Suele ser un problema momentáneo con la base de datos. Probá de nuevo en unos segundos.
      </p>
      <button
        onClick={() => retry()}
        className="mt-4 rounded-md bg-texto px-3 py-2 text-sm font-semibold text-fondo"
      >
        Reintentar
      </button>
      {error.digest && <p className="mt-6 text-xs text-suave">Código del error: {error.digest}</p>}
    </main>
  );
}
