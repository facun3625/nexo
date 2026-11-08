"use client";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { PauseIcon, PlayIcon, ReceiptTextIcon, Trash2Icon } from "lucide-react";

import {
  addContractChargeConcept,
  removeContractChargeConcept,
  setContractChargeConceptActive,
  updateContractChargeConceptAmount,
} from "@/app/admin/gestion/actions";
import { useConfirm } from "@/components/admin/confirm-provider";
import { inputClass } from "@/components/estate/form-field-class";

type Concept = { id: string; name: string; active: boolean; amount: string };

// Cada concepto (expensas, ABL, tasas) guarda el monto vigente, el mismo que
// se va a cobrar todos los meses hasta que se edite acá — la mayoría de los
// meses no cambia. "Cargar cobros de este mes" (más abajo) arma el cobro con
// ese monto para confirmar; cuando un mes sí cambia (ej. subieron las
// expensas) se actualiza el número acá antes de generar ese cobro.
export function ContractChargeConceptsManager({
  contractId,
  currency,
  concepts,
}: {
  contractId: string;
  currency: string;
  concepts: Concept[];
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState(concepts);
  const [adding, startAdd] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleAdd(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const amountValue = String(formData.get("amount") ?? "").trim();
    if (!name) return;
    startAdd(async () => {
      const fd = new FormData();
      fd.set("contractId", contractId);
      fd.set("name", name);
      fd.set("amount", amountValue);
      const result = await addContractChargeConcept(fd);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => [...prev, { id: result.id, name, active: true, amount: amountValue }]);
      formRef.current?.reset();
      toast.success("Concepto agregado");
    });
  }

  async function saveAmount(concept: Concept, value: string) {
    if (value === concept.amount) return;
    setItems((prev) => prev.map((c) => (c.id === concept.id ? { ...c, amount: value } : c)));
    const result = await updateContractChargeConceptAmount(concept.id, value);
    if ("error" in result) {
      toast.error(result.error);
      setItems((prev) => prev.map((c) => (c.id === concept.id ? { ...c, amount: concept.amount } : c)));
    }
  }

  async function toggleActive(concept: Concept) {
    setBusyId(concept.id);
    const result = await setContractChargeConceptActive(concept.id, !concept.active);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setItems((prev) =>
      prev.map((c) => (c.id === concept.id ? { ...c, active: !c.active } : c)),
    );
  }

  async function handleRemove(concept: Concept) {
    const ok = await confirm({
      title: "Borrar concepto",
      description: `¿Borrar "${concept.name}" del catálogo de este contrato? No borra los cobros que ya se generaron con este concepto.`,
      confirmLabel: "Borrar",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(concept.id);
    const result = await removeContractChargeConcept(concept.id);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => prev.filter((c) => c.id !== concept.id));
    toast.success("Concepto borrado");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">Gastos recurrentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Expensas, ABL, tasas — conceptos que se suman al alquiler todos los meses. El monto que
          cargues acá es el que se va a usar cada vez; si un mes cambia (ej. subieron las
          expensas), actualizalo acá antes de cargar el cobro de ese mes.
        </p>
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y rounded-xl border">
          {items.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <ReceiptTextIcon className="size-4 shrink-0 text-muted-foreground" />
              <span
                className={`min-w-0 flex-1 truncate text-sm font-medium ${c.active ? "" : "text-muted-foreground line-through"}`}
              >
                {c.name}
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                defaultValue={c.amount}
                onBlur={(e) => saveAmount(c, e.target.value)}
                placeholder="Monto"
                aria-label={`Monto de ${c.name}`}
                className={`${inputClass} w-32 py-1.5 text-sm`}
              />
              <span className="w-9 shrink-0 text-xs text-muted-foreground">{currency}</span>
              {!c.active && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Pausado
                </span>
              )}
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => toggleActive(c)}
                aria-label={c.active ? `Pausar ${c.name}` : `Reactivar ${c.name}`}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                {c.active ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
              </button>
              <button
                type="button"
                disabled={busyId === c.id}
                onClick={() => handleRemove(c)}
                aria-label={`Borrar ${c.name}`}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-40"
              >
                <Trash2Icon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form ref={formRef} action={handleAdd} className="flex flex-wrap items-end gap-2">
        <div className="w-56">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Nuevo concepto
          </label>
          <input name="name" placeholder="Ej: Expensas" maxLength={200} className={inputClass} />
        </div>
        <div className="w-32">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Monto ({currency})
          </label>
          <input name="amount" type="number" min={0} step="0.01" placeholder="Monto" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}
