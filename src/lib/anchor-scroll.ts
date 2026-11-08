// Scroll con offset calculado contra el <header> sticky real (no un
// scroll-margin fijo en CSS) — así el salto queda exacto incluso si arriba
// hay contenido (imágenes, fuentes, animaciones de entrada) que todavía
// está acomodando su alto. Compartido entre el nav y el footer públicos
// para que se comporten exactamente igual.
function scrollToAnchorOnce(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const nav = document.querySelector("header");
  const navHeight = nav?.getBoundingClientRect().height ?? 80;
  const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
  window.scrollTo({ top, behavior: "smooth" });
}

// Una sola medición puede quedar corta: si arriba del destino hay imágenes o
// fuentes que todavía no terminaron de cargar, el alto real cambia después
// del primer salto. Reintenta unas cuantas veces mientras el layout se
// termina de asentar, en vez de confiar en un único cálculo a ciegas.
export function scrollToAnchor(id: string) {
  scrollToAnchorOnce(id);
  [120, 300, 600, 1000].forEach((delay) => setTimeout(() => scrollToAnchorOnce(id), delay));
}

export function handleAnchorNavClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  pathname: string | null,
  id: string,
) {
  if (pathname !== "/") return; // navegación normal a "/#id", se corrige al llegar (ver el useEffect en UrbiPublicNav)
  event.preventDefault();
  scrollToAnchor(id);
  window.history.pushState(null, "", `/#${id}`);
}
