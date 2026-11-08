"use client";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CheckCircle2Icon, ImagePlusIcon, Trash2Icon } from "lucide-react";

import {
  uploadContractHandoverPhoto,
  deleteContractHandoverPhoto,
  setContractHandoverAcceptance,
} from "@/app/admin/gestion/actions";
import { useConfirm } from "@/components/admin/confirm-provider";

type HandoverPhoto = { id: string; url: string };

const MAX_PHOTOS_PER_UPLOAD = 15;

// Estado del inmueble al iniciar el alquiler (Etapa 7, opcional). Sin portal
// de autogestión todavía: la aceptación la marca a mano el personal de la
// inmobiliaria, no es una firma digital real del inquilino/propietario.
// Todo se guarda al toque — el estado se actualiza en el cliente en vez de
// pedir router.refresh(), que hace saltar el scroll al principio.
export function ContractHandoverSection({
  contractId,
  photos,
  tenantAcceptedAt,
  ownerAcceptedAt,
}: {
  contractId: string;
  photos: HandoverPhoto[];
  tenantAcceptedAt: string | null;
  ownerAcceptedAt: string | null;
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState(photos);
  const [tenantAccepted, setTenantAccepted] = useState(Boolean(tenantAcceptedAt));
  const [ownerAccepted, setOwnerAccepted] = useState(Boolean(ownerAcceptedAt));
  const [uploading, startUpload] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyParty, setBusyParty] = useState<"tenant" | "owner" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(files: File[]) {
    if (!files.length) return;
    const batch = files.slice(0, MAX_PHOTOS_PER_UPLOAD);
    if (files.length > MAX_PHOTOS_PER_UPLOAD)
      toast.error(`Se suben hasta ${MAX_PHOTOS_PER_UPLOAD} fotos por vez — el resto no se subió.`);
    startUpload(async () => {
      const results = await Promise.all(
        batch.map((file) => {
          const formData = new FormData();
          formData.set("contractId", contractId);
          formData.set("file", file);
          return uploadContractHandoverPhoto(formData);
        }),
      );
      const uploaded = results.filter((r) => !("error" in r));
      const failed = results.length - uploaded.length;
      if (uploaded.length) {
        setItems((prev) => [
          ...prev,
          ...uploaded.map((r) => (r as { ok: true; photo: HandoverPhoto }).photo),
        ]);
        toast.success(
          uploaded.length === 1 ? "Foto subida" : `${uploaded.length} fotos subidas`,
        );
      }
      if (failed) toast.error(`${failed} foto(s) no se pudieron subir`);
    });
  }

  async function handleDelete(id: string) {
    const ok = await confirm({
      title: "Borrar foto",
      description: "¿Borrar esta foto del estado del inmueble?",
      confirmLabel: "Borrar",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(id);
    const result = await deleteContractHandoverPhoto(id);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Foto eliminada");
  }

  async function toggleAcceptance(party: "tenant" | "owner", currentlyAccepted: boolean) {
    if (!currentlyAccepted) {
      const ok = await confirm({
        title: party === "tenant" ? "Marcar aceptado por el inquilino" : "Marcar aceptado por el propietario",
        description:
          "Esto no es una firma digital: marcalo solo después de tener la conformidad en papel o de palabra.",
        confirmLabel: "Marcar aceptado",
      });
      if (!ok) return;
    }
    setBusyParty(party);
    const result = await setContractHandoverAcceptance(contractId, party, !currentlyAccepted);
    setBusyParty(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    if (party === "tenant") setTenantAccepted(!currentlyAccepted);
    else setOwnerAccepted(!currentlyAccepted);
    toast.success(!currentlyAccepted ? "Marcado como aceptado" : "Se sacó la aceptación");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">Estado del inmueble al iniciar el alquiler</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Fotos de cómo estaba la propiedad, más la conformidad de cada parte — marcada a mano por
          ahora, sin firma digital. Se guarda al toque, no hace falta tocar &quot;Guardar
          cambios&quot; de arriba.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {items.map((p) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-muted">
            <Image src={p.url} alt="" fill className="object-cover" />
            <button
              type="button"
              disabled={busyId === p.id}
              onClick={() => handleDelete(p.id)}
              className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
              aria-label="Borrar foto"
            >
              <Trash2Icon className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-60"
        >
          <ImagePlusIcon className="size-5" />
          <span className="text-xs">{uploading ? "Subiendo…" : "Agregar"}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            handleUpload(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-4">
        {(
          [
            ["tenant", "Inquilino", tenantAccepted],
            ["owner", "Propietario", ownerAccepted],
          ] as const
        ).map(([party, label, accepted]) => (
          <button
            key={party}
            type="button"
            disabled={busyParty === party}
            onClick={() => toggleAcceptance(party, accepted)}
            className={
              accepted
                ? "inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-medium text-emerald-700"
                : "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            }
          >
            <CheckCircle2Icon className="size-4" />
            {accepted ? `Aceptado por el ${label.toLowerCase()}` : `Marcar aceptado por el ${label.toLowerCase()}`}
          </button>
        ))}
      </div>
    </div>
  );
}
