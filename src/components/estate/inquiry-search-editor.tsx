"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchCriteriaFields, type SearchOptions } from "./search-criteria-fields";
import type { SearchCriteria } from "@/lib/estate/search-criteria";
import { updateInquirySearch } from "@/app/admin/gestion/search-actions";

export function InquirySearchEditor({ id, criteria, options }: { id: string; criteria: SearchCriteria; options: SearchOptions }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  return <details className="rounded-xl border p-4"><summary className="cursor-pointer text-sm font-medium">Editar requisitos de la búsqueda</summary><form className="mt-4" action={(form) => start(async () => {
    setError("");
    try {
      const result = await updateInquirySearch(id, form);
      if ("error" in result) setError(result.error); else router.refresh();
    } catch { setError("No se pudo guardar la búsqueda."); }
  })}><fieldset disabled={pending} className="space-y-4 disabled:opacity-60"><SearchCriteriaFields options={options} values={criteria} />{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">{pending ? "Guardando…" : "Guardar y recalcular coincidencias"}</button></fieldset></form></details>;
}
