"use client";

import { useTransition } from "react";
import { toast } from "sonner";

// Un <form action={...}> de Next exige que la action devuelva void, así que no
// tiene dónde mostrar un motivo cuando algo sale mal. Este la llama desde el
// cliente y manda el error a un toast, sin obligar a convertir la página
// entera en client component.
export function ActionForm({
  action,
  children,
  ...props
}: Omit<React.FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (formData: FormData) => Promise<unknown>;
}) {
  const [, startTransition] = useTransition();

  return (
    <form
      {...props}
      action={(formData) =>
        startTransition(async () => {
          try {
            const result = await action(formData);
            if (result && typeof result === "object" && "error" in result) {
              toast.error(String(result.error));
            }
          } catch {
            toast.error("Se cortó la conexión. Probá de nuevo.");
          }
        })
      }
    >
      {children}
    </form>
  );
}
