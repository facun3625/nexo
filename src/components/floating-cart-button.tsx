"use client";

import { usePathname } from "next/navigation";
import { ShoppingBagIcon } from "lucide-react";

import { useCart } from "@/lib/cart-context";

export function FloatingCartButton() {
  const pathname = usePathname();
  const { itemCount, openCart, isCartOpen } = useCart();

  if (pathname.startsWith("/admin")) return null;
  // Si no se oculta al abrir el carrito, queda tapando la cruz de cerrar
  // del Sheet — comparten casi la misma posición (top-4 right-4).
  if (isCartOpen) return null;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label="Carrito"
      // z-30, no z-99: cualquier Sheet/Dialog (menú hamburguesa, carrito,
      // etc.) usa z-50 — este botón tiene que quedar siempre por detrás
      // para no tapar su cruz de cerrar, comparta o no la misma esquina.
      className="fixed top-4 right-4 z-30 flex size-10 items-center justify-center rounded-full bg-background text-foreground shadow-lg ring-1 ring-border transition-transform hover:scale-110 active:scale-95 lg:hidden"
    >
      <ShoppingBagIcon className="size-4.5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex size-4.5 items-center justify-center rounded-full bg-primary text-[0.65rem] font-medium text-primary-foreground">
          {itemCount}
        </span>
      )}
    </button>
  );
}
