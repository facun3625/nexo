"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Dispara una server action al montar de verdad en el navegador — a
// diferencia de escribir directo en el render de una página, esto no se
// activa con el prefetch de <Link> (que solo pide el RSC, nunca monta nada
// del lado del cliente). Por eso "marcar como visto" tiene que vivir acá y
// no en el componente de servidor de la página.
export function MarkSeenOnMount({
  when,
  action,
}: {
  when: boolean;
  action: () => Promise<unknown>;
}) {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (!when || fired.current) return;
    fired.current = true;
    action().then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when]);

  return null;
}
