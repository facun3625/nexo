"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";
import { PostSalePhotoPicker } from "./post-sale-photo-picker";
import { SelectField } from "./select-field";
import { warrantyStatus } from "@/lib/post-sale-warranty";

type Rubro = { id: string; name: string; warrantyMonths: number | null };
type Section = { id: string; name: string; rubros: Rubro[] };

export function PostSaleClaimForm({
  sections,
  unitDeliveredAt,
  action,
  onDoneHref,
}: {
  sections: Section[];
  unitDeliveredAt: Date | string | null;
  action: (form: FormData) => Promise<{ ok: true } | { error: string }>;
  onDoneHref: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [rubroId, setRubroId] = useState("");
  const router = useRouter();

  const rubros = useMemo(
    () => sections.find((s) => s.id === sectionId)?.rubros ?? [],
    [sections, sectionId],
  );
  const selectedRubro = useMemo(() => rubros.find((r) => r.id === rubroId) ?? null, [rubros, rubroId]);
  const warranty = useMemo(
    () => (selectedRubro ? warrantyStatus(unitDeliveredAt, selectedRubro.warrantyMonths) : null),
    [unitDeliveredAt, selectedRubro],
  );

  return (
    <form
      className="space-y-4"
      action={(form) =>
        start(async () => {
          setMessage("");
          const result = await action(form);
          if ("error" in result) setMessage(result.error);
          else router.push(onDoneHref);
        })
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Sección</span>
          <SelectField
            name="sectionId"
            required
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
          >
            <option value="" disabled>
              Elegí una sección
            </option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        </label>
        <label className="space-y-1 text-sm">
          <span>Rubro</span>
          <SelectField
            name="rubroId"
            required
            disabled={!sectionId}
            value={rubroId}
            onChange={(e) => setRubroId(e.target.value)}
          >
            <option value="" disabled>
              {sectionId ? "Elegí un rubro" : "Elegí primero una sección"}
            </option>
            {rubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </SelectField>
        </label>
      </div>

      {warranty && warranty.status !== "DESCONOCIDA" && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            warranty.status === "VIGENTE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {warranty.status === "VIGENTE"
            ? "Esto todavía está en garantía."
            : "Esto ya no está en garantía — igual podés enviar el reclamo, pero puede no cubrirse sin cargo."}
        </p>
      )}

      <label className="block space-y-1 text-sm">
        <span>¿Qué pasa?</span>
        <input name="title" required maxLength={120} placeholder="Ej: humedad en el techo" className={inputClass} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Contanos más (opcional)</span>
        <textarea name="description" rows={4} maxLength={4000} className={inputClass} />
      </label>

      <PostSalePhotoPicker />

      <button
        disabled={pending}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        {pending ? "Enviando…" : "Enviar reclamo"}
      </button>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
