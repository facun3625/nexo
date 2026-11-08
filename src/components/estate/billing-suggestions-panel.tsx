"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SparklesIcon } from "lucide-react";

import { approveBillingSuggestion, dismissBillingSuggestion } from "@/app/admin/gestion/actions";
import { money } from "@/lib/estate/modules";
import { inputClass } from "@/components/estate/form-field-class";

type RentUpdatePayload = {
  newAmount?: string;
  oldAmount?: string;
  percent?: string;
  index?: string;
  note?: string;
};
type ExtraChargeItem = { conceptId: string; concept: string; amount: string; currency: string };
type ExtraChargesPayload = { items: ExtraChargeItem[] };

export type BillingSuggestion = {
  id: string;
  kind: "RENT_UPDATE" | "EXTRA_CHARGES";
  contractReference: string;
  period: string;
  payload: RentUpdatePayload | ExtraChargesPayload;
  currency: string;
};

// "Modo revisión" (Etapa 6.5) — lo que el cron de /api/cron/estate-billing
// calculó pero no aplicó solo. Aplicar acá es el único lugar donde una
// actualización automática cambia el monto de un contrato, o donde un gasto
// recurrente (expensas, ABL) se convierte en un cobro real.
export function BillingSuggestionsPanel({ suggestions }: { suggestions: BillingSuggestion[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (suggestions.length === 0) return null;

  const rentUpdates = suggestions.filter((s) => s.kind === "RENT_UPDATE");
  const extraCharges = suggestions.filter((s) => s.kind === "EXTRA_CHARGES");

  async function dismiss(id: string) {
    setBusyId(id);
    const result = await dismissBillingSuggestion(id);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Descartada");
    router.refresh();
  }

  async function approveRentUpdate(id: string) {
    setBusyId(id);
    const result = await approveBillingSuggestion(id);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Actualización aplicada");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {rentUpdates.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <SparklesIcon className="size-4 text-amber-700" />
            <h2 className="font-semibold text-amber-900">
              Actualizaciones pendientes de revisar ({rentUpdates.length})
            </h2>
          </div>
          <ul className="flex flex-col divide-y divide-amber-200/70 rounded-xl border border-amber-200 bg-white">
            {rentUpdates.map((s) => {
              const payload = s.payload as RentUpdatePayload;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate font-medium">{s.contractReference}</span>
                  <span className="text-muted-foreground">{s.period}</span>
                  <span className="min-w-0 flex-1 text-muted-foreground">
                    {payload.newAmount ? (
                      <>
                        {money(payload.oldAmount ?? "0", s.currency)} → {money(payload.newAmount, s.currency)}
                        {payload.percent ? ` (${payload.percent}%${payload.index ? ` ${payload.index}` : ""})` : ""}
                      </>
                    ) : (
                      payload.note ?? "Corresponde actualizar"
                    )}
                  </span>
                  <div className="flex shrink-0 gap-2">
                    {payload.newAmount && (
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => approveRentUpdate(s.id)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        Aplicar
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busyId === s.id}
                      onClick={() => dismiss(s.id)}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      Descartar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {extraCharges.map((s) => (
        <ExtraChargesCard key={s.id} suggestion={s} busy={busyId === s.id} setBusy={setBusyId} />
      ))}
    </div>
  );
}

function ExtraChargesCard({
  suggestion,
  busy,
  setBusy,
}: {
  suggestion: BillingSuggestion;
  busy: boolean;
  setBusy: (id: string | null) => void;
}) {
  const router = useRouter();
  const payload = suggestion.payload as ExtraChargesPayload;
  const [rows, setRows] = useState(
    payload.items.map((item) => ({ ...item, include: true })),
  );

  function updateRow(conceptId: string, patch: Partial<{ amount: string; include: boolean }>) {
    setRows((prev) => prev.map((r) => (r.conceptId === conceptId ? { ...r, ...patch } : r)));
  }

  async function confirmSelected() {
    const missing = rows.some((r) => r.include && !r.amount.trim());
    if (missing) {
      toast.error("Cargá un monto para cada concepto tildado, o destildalo");
      return;
    }
    setBusy(suggestion.id);
    const result = await approveBillingSuggestion(
      suggestion.id,
      rows.map((r) => ({
        conceptId: r.conceptId,
        concept: r.concept,
        amount: r.amount,
        // el server valida contra el enum real — acá el tipo es string
        // porque viene de EstateContract.currency, que no es un literal.
        currency: r.currency as "ARS" | "USD",
        include: r.include,
      })),
    );
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Gastos del mes confirmados");
    router.refresh();
  }

  async function discardAll() {
    setBusy(suggestion.id);
    const result = await dismissBillingSuggestion(suggestion.id);
    setBusy(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Descartado — no se cobra este mes");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <SparklesIcon className="size-4 text-amber-700" />
        <h2 className="font-semibold text-amber-900">
          Gastos de {suggestion.contractReference} — {suggestion.period}
        </h2>
      </div>
      <ul className="flex flex-col divide-y rounded-xl border border-amber-200 bg-white">
        {rows.map((r) => (
          <li key={r.conceptId} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <input
                type="checkbox"
                checked={r.include}
                onChange={(e) => updateRow(r.conceptId, { include: e.target.checked })}
              />
              <span className={r.include ? "font-medium" : "font-medium text-muted-foreground line-through"}>
                {r.concept}
              </span>
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              disabled={!r.include}
              value={r.amount}
              onChange={(e) => updateRow(r.conceptId, { amount: e.target.value })}
              placeholder="Monto"
              className={`${inputClass} w-32 py-1.5 text-sm disabled:opacity-50`}
            />
            <span className="w-10 shrink-0 text-xs text-muted-foreground">{r.currency}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={discardAll}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          Descartar todo este mes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={confirmSelected}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
        >
          Confirmar y generar cobros
        </button>
      </div>
    </div>
  );
}
