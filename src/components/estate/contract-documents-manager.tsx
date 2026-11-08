"use client";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { FileTextIcon, Trash2Icon, UploadIcon } from "lucide-react";

import {
  uploadContractDocument,
  deleteContractDocument,
  updateContractDocumentVisibility,
} from "@/app/admin/gestion/actions";
import { useConfirm } from "@/components/admin/confirm-provider";
import { StyledSelect } from "@/components/estate/styled-select";
import { inputClass } from "@/components/estate/form-field-class";
import { labels } from "@/lib/estate/modules";

const DOC_TYPES = ["SIGNED_CONTRACT", "INVENTORY", "DELIVERY_ACT", "OTHER"] as const;
const VISIBILITIES = ["AGENCY_ONLY", "TENANT", "OWNER", "BOTH_PARTIES"] as const;

type ContractDocument = {
  id: string;
  title: string;
  type: string;
  visibility: string;
  url: string;
  createdAt: string | Date;
};

// Documentos del contrato (Etapa 5) — subir/borrar/cambiar visibilidad son
// acciones inmediatas, independientes del submit grande de RecordForm. Sin
// enforcement de visibilidad todavía: no hay portal externo que la lea.
export function ContractDocumentsManager({
  contractId,
  documents,
}: {
  contractId: string;
  documents: ContractDocument[];
}) {
  const confirm = useConfirm();
  const [items, setItems] = useState(documents);
  const [uploading, startUpload] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(DOC_TYPES[0]);
  const [visibility, setVisibility] = useState<string>("AGENCY_ONLY");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(file: File | null) {
    if (!file) return;
    startUpload(async () => {
      const formData = new FormData();
      formData.set("contractId", contractId);
      formData.set("title", title.trim());
      formData.set("type", type);
      formData.set("visibility", visibility);
      formData.set("file", file);
      const result = await uploadContractDocument(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => [result.document, ...prev]);
      toast.success("Documento subido");
      setTitle("");
    });
  }

  function triggerUpload() {
    if (!title.trim()) {
      toast.error("Ponele un título al documento antes de subirlo");
      return;
    }
    fileInputRef.current?.click();
  }

  async function handleDelete(id: string, docTitle: string) {
    const ok = await confirm({
      title: "Borrar documento",
      description: `¿Borrar "${docTitle}" de este contrato?`,
      confirmLabel: "Borrar",
      destructive: true,
    });
    if (!ok) return;
    setBusyId(id);
    const result = await deleteContractDocument(id);
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => prev.filter((d) => d.id !== id));
    toast.success("Documento eliminado");
  }

  async function handleVisibilityChange(id: string, newVisibility: string) {
    const result = await updateContractDocumentVisibility(id, newVisibility);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, visibility: newVisibility } : d)),
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">Documentos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Contrato firmado, inventario, acta de entrega u otra documentación. Se guardan al
          toque, no hace falta tocar &quot;Guardar cambios&quot; de arriba. La visibilidad es
          solo un dato guardado — todavía no hay un portal externo que la use.
        </p>
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col divide-y rounded-xl border">
          {items.map((doc) => (
            <li key={doc.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm font-medium text-primary hover:underline"
                >
                  {doc.title}
                </a>
                <p className="truncate text-xs text-muted-foreground">
                  {labels[doc.type] ?? doc.type}
                </p>
              </div>
              <div className="w-44 shrink-0">
                <StyledSelect
                  aria-label="Visibilidad"
                  defaultValue={doc.visibility}
                  onChange={(e) => handleVisibilityChange(doc.id, e.target.value)}
                >
                  {VISIBILITIES.map((v) => (
                    <option key={v} value={v}>
                      {labels[v] ?? v}
                    </option>
                  ))}
                </StyledSelect>
              </div>
              <button
                type="button"
                disabled={busyId === doc.id}
                onClick={() => handleDelete(doc.id, doc.title)}
                aria-label={`Borrar ${doc.title}`}
                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-40"
              >
                <Trash2Icon className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-end gap-2">
        <div className="w-56">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Título</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Contrato firmado 2026"
            maxLength={300}
            className={inputClass}
          />
        </div>
        <div className="w-48">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tipo</label>
          <StyledSelect value={type} onChange={(e) => setType(e.target.value)}>
            {DOC_TYPES.map((t) => (
              <option key={t} value={t}>
                {labels[t] ?? t}
              </option>
            ))}
          </StyledSelect>
        </div>
        <div className="w-48">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Visibilidad
          </label>
          <StyledSelect value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            {VISIBILITIES.map((v) => (
              <option key={v} value={v}>
                {labels[v] ?? v}
              </option>
            ))}
          </StyledSelect>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={triggerUpload}
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium disabled:opacity-50"
        >
          <UploadIcon className="size-4" />
          {uploading ? "Subiendo…" : "Subir documento"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            handleUpload(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
