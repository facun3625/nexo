"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore } from "react";

export type CartItem = {
  productVariantId: string;
  productId: string;
  productName: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string | null;
  maxQuantity: number;
  // Productos que comparten un pozo de stock ("grupo") tienen el mismo id
  // acá — el máximo se reparte entre todos, no es por producto.
  stockGroupId: string | null;
};

type CartState = {
  deliveryDateId: string | null;
  items: CartItem[];
};

type CartContextValue = {
  cart: CartState;
  addItem: (deliveryDateId: string, item: Omit<CartItem, "quantity">, quantity: number) => "added" | "needs-confirmation";
  confirmReplace: (deliveryDateId: string, item: Omit<CartItem, "quantity">, quantity: number) => void;
  updateQuantity: (productVariantId: string, quantity: number, freshMaxQuantity?: number) => void;
  removeItem: (productVariantId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const STORAGE_KEY_PREFIX = "pedidos-cart";
const emptyState: CartState = { deliveryDateId: null, items: [] };

// El subdominio de una tienda puede reasignarse a un Tenant distinto (ej: se
// borró y se creó una tienda nueva con el mismo nombre) — como el storage es
// por origen del navegador, sin esto el carrito viejo reaparecería con
// productos que ya no existen. Se ata al id real del tenant, no al
// subdominio.
let activeStorageKey = STORAGE_KEY_PREFIX;

// Suma la cantidad ya reservada en el carrito por otras líneas del mismo
// grupo de stock compartido (excluyendo, opcionalmente, una línea puntual).
function groupUsed(items: CartItem[], stockGroupId: string | null, excludeVariantId?: string) {
  if (!stockGroupId) return 0;
  return items
    .filter((i) => i.stockGroupId === stockGroupId && i.productVariantId !== excludeVariantId)
    .reduce((sum, i) => sum + i.quantity, 0);
}

// maxQuantity es el remanente del pozo completo (mismo valor en todos los
// productos del grupo) — el margen real para ESTA línea es ese remanente
// menos lo que ya usan las demás líneas del grupo.
function capFor(items: CartItem[], item: Pick<CartItem, "maxQuantity" | "stockGroupId" | "productVariantId">) {
  if (!item.stockGroupId) return item.maxQuantity;
  const usedElsewhere = groupUsed(items, item.stockGroupId, item.productVariantId);
  return Math.max(0, item.maxQuantity - usedElsewhere);
}

// Cuánto se puede sumar todavía a un grupo (o al remanente de un producto
// sin grupo), contando lo que ya hay en el carrito de esa línea también.
export function roomToAdd(
  items: CartItem[],
  stockGroupId: string | null,
  poolRemaining: number,
  productVariantId?: string,
) {
  const used = stockGroupId
    ? groupUsed(items, stockGroupId)
    : (items.find((i) => i.productVariantId === productVariantId)?.quantity ?? 0);
  return Math.max(0, poolRemaining - used);
}

// Module-level store: read/written directly, outside React state, so the
// cart survives across pages without an effect-driven localStorage sync
// (and without a hydration mismatch, via useSyncExternalStore below).
let cartState: CartState = emptyState;
let storeInitialized = false;
const listeners = new Set<() => void>();

function readFromStorage(): CartState {
  try {
    const raw = localStorage.getItem(activeStorageKey);
    return raw ? JSON.parse(raw) : emptyState;
  } catch {
    return emptyState;
  }
}

// El cambio de tenant (o la primera carga) se resuelve acá adentro, no en el
// cuerpo de CartProvider — mutar estado de módulo directamente durante el
// render del componente rompe las reglas de pureza de React.
function getSnapshotForKey(key: string) {
  if (!storeInitialized || key !== activeStorageKey) {
    activeStorageKey = key;
    cartState = readFromStorage();
    storeInitialized = true;
  }
  return cartState;
}

function getServerSnapshot() {
  return emptyState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setCartState(next: CartState) {
  cartState = next;
  storeInitialized = true;
  try {
    localStorage.setItem(activeStorageKey, JSON.stringify(next));
  } catch {
    // ignore write failures (private mode, quota)
  }
  listeners.forEach((listener) => listener());
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ tenantId, children }: { tenantId: string; children: React.ReactNode }) {
  const key = `${STORAGE_KEY_PREFIX}:${tenantId}`;
  const getSnapshot = useCallback(() => getSnapshotForKey(key), [key]);
  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isCartOpen, setIsCartOpen] = useState(false);

  function addItem(
    deliveryDateId: string,
    item: Omit<CartItem, "quantity">,
    quantity: number,
  ): "added" | "needs-confirmation" {
    const current = getSnapshot();
    if (current.items.length > 0 && current.deliveryDateId !== deliveryDateId) {
      return "needs-confirmation";
    }
    const existing = current.items.find((i) => i.productVariantId === item.productVariantId);
    const cap = capFor(current.items, item);
    const items = existing
      ? current.items.map((i) =>
          i.productVariantId === item.productVariantId
            ? { ...i, maxQuantity: item.maxQuantity, quantity: Math.min(i.quantity + quantity, cap) }
            : i,
        )
      : [...current.items, { ...item, quantity: Math.min(quantity, cap) }];
    setCartState({ deliveryDateId, items });
    return "added";
  }

  function confirmReplace(
    deliveryDateId: string,
    item: Omit<CartItem, "quantity">,
    quantity: number,
  ) {
    setCartState({ deliveryDateId, items: [{ ...item, quantity }] });
  }

  function updateQuantity(productVariantId: string, quantity: number, freshMaxQuantity?: number) {
    const current = getSnapshot();
    const item = current.items.find((i) => i.productVariantId === productVariantId);
    const effective = item && freshMaxQuantity != null ? { ...item, maxQuantity: freshMaxQuantity } : item;
    const cap = effective ? capFor(current.items, effective) : 0;
    setCartState({
      ...current,
      items:
        quantity <= 0
          ? current.items.filter((i) => i.productVariantId !== productVariantId)
          : current.items.map((i) =>
              i.productVariantId === productVariantId
                ? { ...i, maxQuantity: effective!.maxQuantity, quantity: Math.min(quantity, cap) }
                : i,
            ),
    });
  }

  function removeItem(productVariantId: string) {
    const current = getSnapshot();
    setCartState({
      ...current,
      items: current.items.filter((i) => i.productVariantId !== productVariantId),
    });
  }

  function clearCart() {
    setCartState(emptyState);
  }

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = cart.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        confirmReplace,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de CartProvider");
  return ctx;
}
