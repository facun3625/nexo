"use client";

import { ShoppingBagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-context";

export function CartButton({ overlay = false }: { overlay?: boolean }) {
  const { itemCount, openCart } = useCart();

  return (
    <Button
      type="button"
      aria-label="Carrito"
      onClick={openCart}
      variant="outline"
      size="icon"
      className={cn("relative", overlay && "border-white/30 bg-white/15 text-white hover:bg-white/25")}
    >
      <ShoppingBagIcon />
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[0.7rem] font-medium text-primary-foreground">
          {itemCount}
        </span>
      )}
    </Button>
  );
}
