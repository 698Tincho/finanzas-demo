// Tema de la app: oscuro salvo que la cookie "tema" diga "light". La cookie la escribe el
// interruptor del menú; el servidor la lee para mandar la página ya con el tema puesto (sin parpadeo).
export const COOKIE_TEMA = "tema";
export type Tema = "dark" | "light";
export const temaDe = (valor: string | undefined): Tema => (valor === "light" ? "light" : "dark");
