"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";
import { PostSalePhotoPicker } from "./post-sale-photo-picker";
import { SelectField } from "./select-field";
import { warrantyStatus } from "@/lib/post-sale-warranty";

type Owner = { id: string; name: string | null; taxId: string | null };
type Unit = { id: string; label: string; deliveredAt: string | null; owners: Owner[] };
type Rubro = { id: string; name: string; warrantyMonths: number | null };
type Section = { id: string; name: string; rubros: Rubro[] };
type Development = { id: string; name: string; units: Unit[]; sections: Section[] };
type ActionResult = { ok: true } | { error: string };

export function PostSaleStaffClaimForm({
  developments,
  initialDevelopmentId,
  action,
  onDoneHref,
}: {
  developments: Development[];
  initialDevelopmentId?: string;
  action: (form: FormData) => Promise<ActionResult>;
  onDoneHref: string;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const [developmentId, setDevelopmentId] = useState(initialDevelopmentId ?? "");
  const [unitId, setUnitId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [rubroId, setRubroId] = useState("");
  const router = useRouter();

  const development = useMemo(
    () => developments.find((d) => d.id === developmentId),
    [developments, developmentId],
  );
  const units = useMemo(() => development?.units ?? [], [development]);
  const sections = useMemo(() => development?.sections ?? [], [development]);
  const selectedUnit = useMemo(() => units.find((u) => u.id === unitId) ?? null, [units, unitId]);
  const owners = selectedUnit?.owners ?? [];
  const rubros = useMemo(
    () => sections.find((s) => s.id === sectionId)?.rubros ?? [],
    [sections, sectionId],
  );
  const selectedRubro = useMemo(() => rubros.find((r) => r.id === rubroId) ?? null, [rubros, rubroId]);
  const warranty = useMemo(
    () => (selectedUnit && selectedRubro ? warrantyStatus(selectedUnit.deliveredAt, selectedRubro.warrantyMonths) : null),
    [selectedUnit, selectedRubro],
  );

  function changeDevelopment(id: string) {
    setDevelopmentId(id);
    setUnitId("");
    setSectionId("");
  }

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
      <label className="block space-y-1 text-sm">
        <span>Desarrollo</span>
        <SelectField
          name="developmentId"
          required
          value={developmentId}
          onChange={(e) => changeDevelopment(e.target.value)}
        >
          <option value="" disabled>
            Elegí un desarrollo
          </option>
          {developments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Unidad</span>
          <SelectField
            name="unitId"
            required
            disabled={!developmentId}
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
          >
            <option value="" disabled>
              {developmentId ? "Elegí una unidad" : "Elegí primero un desarrollo"}
            </option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </SelectField>
        </label>
        <label className="space-y-1 text-sm">
          <span>Propietario</span>
          <SelectField name="contactId" required disabled={!unitId}>
            <option value="" disabled selected={!unitId}>
              {unitId ? "Elegí un propietario" : "Elegí primero una unidad"}
            </option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name ?? "Sin nombre"} {o.taxId ? `· DNI ${o.taxId}` : ""}
              </option>
            ))}
          </SelectField>
          {unitId && !owners.length && (
            <span className="text-xs text-destructive">
              Esta unidad no tiene propietarios cargados todavía.
            </span>
          )}
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Sección</span>
          <SelectField
            name="sectionId"
            required
            disabled={!developmentId}
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setRubroId("");
            }}
          >
            <option value="" disabled>
              {developmentId ? "Elegí una sección" : "Elegí primero un desarrollo"}
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
          {warranty.status === "VIGENTE" ? "Esto todavía está en garantía." : "Esto ya no está en garantía."}
        </p>
      )}

      <label className="block space-y-1 text-sm">
        <span>¿Qué pasa?</span>
        <input name="title" required maxLength={120} placeholder="Ej: humedad en el techo" className={inputClass} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Detalle (opcional)</span>
        <textarea name="description" rows={4} maxLength={4000} className={inputClass} />
      </label>

      <PostSalePhotoPicker />

      <button
        disabled={pending}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        {pending ? "Guardando…" : "Crear reclamo"}
      </button>
      {message && <p className="text-sm text-destructive">{message}</p>}
    </form>
  );
}
