"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";

type NavItem = { id: string; label: string; icon: ReactNode };

const TOP_OFFSET = 24;

export const SECTION_NAV_ACTIONS_ID = "section-nav-actions";

// Busca el ancestro que de verdad scrollea. El scroll real de la página no
// es el <html> (globals.css le pone scroll-behavior:smooth pero no aplica
// acá) sino el <main> del layout del admin (overflow-y-auto propio).
function findScrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node && node !== document.body) {
    const style = getComputedStyle(node);
    if ((style.overflowY === "auto" || style.overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

// Anima el scrollTop a mano en vez de scrollIntoView({behavior:"smooth"}):
// ese método tiene soporte flojo (a veces directamente no anima, o no
// mueve nada) para contenedores con scroll propio distintos del documento
// — justo el caso de este panel — sobre todo en Safari.
function animateScrollTo(container: HTMLElement, targetTop: number, duration = 450) {
  const startTop = container.scrollTop;
  const distance = targetTop - startTop;
  if (Math.abs(distance) < 1) return;
  const startTime = performance.now();
  function step(now: number) {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    container.scrollTop = startTop + distance * eased;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function SectionNav({ items, extra }: { items: NavItem[]; extra?: ReactNode }) {
  const [active, setActive] = useState(items[0]?.id);
  // Mientras el usuario clickeó un ítem del nav, el observer se ignora: si
  // no, las secciones intermedias que cruzan el margen mientras dura la
  // animación del scroll van pisando el resaltado, y la última en "ganar"
  // puede no ser ni siquiera la sección de destino (ver comentario en
  // handleClick sobre la última sección de la página).
  const suppressObserver = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressObserver.current) return;
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-16px 0px -70% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.id).join(",")]);

  function handleClick(e: MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    // Se fija a mano en vez de esperar al IntersectionObserver: una sección
    // al final de la página puede quedar "clavada" más abajo del viewport
    // porque no hay más contenido debajo para completar el scroll, y ahí el
    // observer nunca la marca como visible en el margen superior.
    suppressObserver.current = true;
    setActive(id);

    const container = findScrollParent(target);
    // La primera sección es la que ya se ve al entrar a la ficha (con el
    // título y el breadcrumb arriba) — volver a ella tiene que llevar al
    // tope de todo, no solo dejarla a TOP_OFFSET del borde del contenedor
    // (eso escondería el título, que quedaría scrolleado por encima).
    const isFirst = items[0]?.id === id;
    if (container) {
      const targetTop = isFirst
        ? 0
        : target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - TOP_OFFSET;
      animateScrollTo(container, Math.max(0, targetTop));
    } else {
      window.scrollTo({
        top: isFirst ? 0 : target.getBoundingClientRect().top + window.scrollY - TOP_OFFSET,
        behavior: "smooth",
      });
    }

    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => {
      suppressObserver.current = false;
    }, 700);
  }

  return (
    <nav className="sticky top-6 flex flex-col gap-1">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(e) => handleClick(e, item.id)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            active === item.id
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {item.icon}
          {item.label}
        </a>
      ))}
      {/* RecordForm monta acá (portal) una copia del botón de guardar, así
          queda a mano mientras se scrollea la ficha. */}
      <div id={SECTION_NAV_ACTIONS_ID} className="mt-3 hidden lg:block" />
      {extra && <div className="mt-1 hidden lg:block">{extra}</div>}
    </nav>
  );
}
