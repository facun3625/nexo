"use client";

import { useRouter } from "next/navigation";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

// Toda la fila navega a la ficha/edición, no solo el lápiz — un click en un
// botón o link propio de adentro (ej: alternar destacado, "Ver publicación")
// no dispara la navegación de la fila gracias al closest() de abajo.
export function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function go(e: MouseEvent | KeyboardEvent) {
    const target = e.target as HTMLElement;
    if (target.closest("a, button, input, select, textarea, [role='button']")) return;
    router.push(href);
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter") go(e);
      }}
      className={className}
    >
      {children}
    </article>
  );
}
