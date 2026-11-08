"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { generateBillingForContract } from "@/app/admin/gestion/actions";

type BillingResult = Extract<Awaited<ReturnType<typeof generateBillingForContract>>, { ok: true }>;

function summarize(result: BillingResult) {
  const parts: string[] = [];
  if (result.chargesGenerated > 0) parts.push(`${result.chargesGenerated} cuota${result.chargesGenerated > 1 ? "s" : ""} de alquiler`);
  if (result.lateFeesGenerated > 0) parts.push(`${result.lateFeesGenerated} punitorio${result.lateFeesGenerated > 1 ? "s" : ""}`);
  if (result.updateSuggestions > 0) parts.push(`${result.updateSuggestions} actualización${result.updateSuggestions > 1 ? "es" : ""} de alquiler para revisar`);
  if (result.extraChargeSuggestions > 0) parts.push(`${result.extraChargeSuggestions} sugerencia${result.extraChargeSuggestions > 1 ? "s" : ""} de gastos recurrentes para revisar`);
  if (result.remindersSent > 0) parts.push(`${result.remindersSent} recordatorio${result.remindersSent > 1 ? "s" : ""} de vencimiento enviado${result.remindersSent > 1 ? "s" : ""}`);
  if (parts.length === 0) {
    return "Ya está todo generado para este período en este contrato — no había nada nuevo.";
  }
  return `Se generaron: ${parts.join(", ")}.`;
}

export function GenerateBillingButton({ contractId }: { contractId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await generateBillingForContract(contractId);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(summarize(result));
      router.refresh();
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      <RefreshCwIcon className={`size-4 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Generando..." : "Cargar cobros de este mes"}
    </Button>
  );
}
