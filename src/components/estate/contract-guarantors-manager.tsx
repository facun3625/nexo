"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { UserRoundPlusIcon, UsersIcon, XIcon } from "lucide-react";

import { addContractGuarantor, removeContractGuarantor } from "@/app/admin/gestion/actions";
import { useConfirm } from "@/components/admin/confirm-provider";
import { SearchableSelect } from "@/components/estate/searchable-select";
import { ContactQuickCreateModal } from "@/components/estate/contact-quick-create-modal";

type Guarantor = { id: string; contactId: string; name: string };
type ContactOption = { id: string; label: string };

// Garantes del contrato — varios-a-muchos, acciones inmediatas (se guardan
// al toque, no dependen del submit grande de RecordForm). El estado se
// actualiza en el cliente en vez de pedir router.refresh(): ya sabemos qué
// se agregó o se quitó, y un refresh del server component hace saltar el
// scroll al principio de la página.
export function ContractGuarantorsManager({
  contractId,
  guarantors,
  contactOptions,
}: {
  contractId: string;
  guarantors: Guarantor[];
  contactOptions: ContactOption[];
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState(guarantors);
  const [adding, startAdd] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const availableOptions = contactOptions.filter(
    (o) => !items.some((g) => g.contactId === o.id),
  );

  function addGuarantor(contactId: string, name: string) {
    startAdd(async () => {
      const formData = new FormData();
      formData.set("contractId", contractId);
      formData.set("contactId", contactId);
      const result = await addContractGuarantor(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => [...prev, { id: result.id, contactId, name }]);
      setPickerKey((k) => k + 1);
      toast.success("Garante agregado");
    });
  }

  async function handleRemove(id: string, name: string) {
    const ok = await confirm({
      title: "Quitar garante",
      description: `¿Quitar a ${name} como garante de este contrato?`,
      confirmLabel: "Quitar",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(id);
    const result = await removeContractGuarantor(id);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => prev.filter((g) => g.id !== id));
    toast.success("Garante quitado");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">Garantes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Personas que respaldan este contrato — podés agregar más de una. Se guardan al toque, no
          hace falta tocar &quot;Guardar cambios&quot; de arriba.
        </p>
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y rounded-xl border">
          {items.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <UsersIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{g.name}</span>
              <button
                type="button"
                disabled={busyId === g.id}
                onClick={() => handleRemove(g.id, g.name)}
                aria-label={`Quitar a ${g.name}`}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-40"
              >
                <XIcon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        action={(formData) => {
          const contactId = String(formData.get("contactId") ?? "");
          const name = availableOptions.find((o) => o.id === contactId)?.label;
          if (contactId && name) addGuarantor(contactId, name);
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="w-64" key={pickerKey}>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Agregar garante existente
          </label>
          <SearchableSelect name="contactId" options={availableOptions} />
        </div>
        <button
          type="submit"
          disabled={adding || availableOptions.length === 0}
          className="rounded-xl border px-4 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          Agregar
        </button>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium"
        >
          <UserRoundPlusIcon className="size-4" />
          Crear nuevo garante
        </button>
      </form>

      <ContactQuickCreateModal
        open={modalOpen}
        role="GUARANTOR"
        title="Nuevo garante"
        onClose={() => setModalOpen(false)}
        onCreated={(contact) => {
          setModalOpen(false);
          addGuarantor(contact.id, contact.label);
        }}
      />
    </div>
  );
}
