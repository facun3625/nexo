"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  recordEstateReceipt,
  cancelEstateCharge,
} from "@/app/admin/gestion/actions";
import { inputClass } from "./record-form";
export function PaymentForm({
  chargeId,
  balance,
  currency,
}: {
  chargeId: string;
  balance: string;
  currency: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [key, setKey] = useState(() => crypto.randomUUID());
  const router = useRouter();
  return (
    <div className="space-y-3">
      <form
        action={(form) =>
          start(async () => {
            setError("");
            try {
              const result = await recordEstateReceipt(form);
              if ("error" in result) setError(result.error);
              else {
                setKey(crypto.randomUUID());
                router.refresh();
              }
            } catch {
              setError("No se pudo confirmar. Reintentá con los mismos datos.");
            }
          })
        }
        className="grid gap-3 sm:grid-cols-2"
      >
        <input type="hidden" name="chargeId" value={chargeId} />
        <input type="hidden" name="idempotencyKey" value={key} />
        <label className="text-sm">
          Importe ({currency})
          <input
            name="amount"
            type="number"
            min="0.01"
            max={balance}
            step="0.01"
            required
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Medio
          <select name="method" className={inputClass}>
            <option value="TRANSFER">Transferencia confirmada</option>
            <option value="CASH">Efectivo</option>
          </select>
        </label>
        <label className="text-sm">
          Fecha
          <input name="paidAt" type="date" required className={inputClass} />
        </label>
        <label className="text-sm">
          Referencia / recibo
          <input
            name="reference"
            required
            maxLength={300}
            className={inputClass}
          />
        </label>
        <button
          disabled={pending}
          className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {pending ? "Registrando…" : "Confirmar cobro recibido"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
export function CancelCharge({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <div>
      <button
        disabled={pending}
        className="text-sm text-destructive underline"
        onClick={() => {
          if (
            !window.confirm(
              "¿Anular esta obligación sin cobros? Quedará conservada en el historial.",
            )
          )
            return;
          start(async () => {
            try {
              const form = new FormData();
              form.set("id", id);
              const result = await cancelEstateCharge(form);
              if ("error" in result) setError(result.error);
              else router.refresh();
            } catch {
              setError("No se pudo anular");
            }
          });
        }}
      >
        Anular obligación
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
