"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart-context";
import { LoginDialogProvider } from "@/lib/login-dialog-context";
import { LoginDialog } from "@/components/login-dialog";
import { FavoritesSync } from "@/components/favorites-sync";
import { useStoreSettings } from "@/lib/store-settings-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const { tenantId } = useStoreSettings();
  return (
    <SessionProvider>
      <LoginDialogProvider>
        <CartProvider tenantId={tenantId}>
          {children}
          <LoginDialog />
          <FavoritesSync />
          <Toaster />
        </CartProvider>
      </LoginDialogProvider>
    </SessionProvider>
  );
}
