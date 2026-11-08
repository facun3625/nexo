"use client";

import { createContext, useContext } from "react";
import type { StoreSettings } from "@/lib/settings";

type StoreSettingsValue = StoreSettings & { tenantId: string };

const StoreSettingsContext = createContext<StoreSettingsValue | null>(null);

export function StoreSettingsProvider({
  value,
  children,
}: {
  value: StoreSettingsValue;
  children: React.ReactNode;
}) {
  return (
    <StoreSettingsContext.Provider value={value}>{children}</StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) throw new Error("useStoreSettings debe usarse dentro de StoreSettingsProvider");
  return ctx;
}
