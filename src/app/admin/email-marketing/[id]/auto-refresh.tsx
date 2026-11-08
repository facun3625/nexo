"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Mientras la campaña se envía en segundo plano, refresca el avance.
export function AutoRefresh({ every = 3000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), every);
    return () => clearInterval(timer);
  }, [router, every]);
  return null;
}
