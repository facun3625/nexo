"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAssignedInquiry } from "@/app/agente/actions";
import { StyledSelect } from "./styled-select";
import { inputClass } from "./form-field-class";
export function AssignedInquiryEditor({ id, status, notes }: { id: string; status: string; notes: string }) {
  const [pending, start] = useTransition(); const [message, setMessage] = useState(""); const router = useRouter();
  return <form className="space-y-3" action={(form) => start(async () => {
    try { const result = await updateAssignedInquiry(id, form); setMessage("error" in result ? result.error : "Seguimiento guardado"); if (!("error" in result)) router.refresh(); } catch { setMessage("No se pudo guardar"); }
  })}><fieldset disabled={pending} className="space-y-3"><label className="block space-y-1 text-sm"><span>Estado</span><StyledSelect name="status" defaultValue={status}><option value="NEW">Ingresada</option><option value="READ">Leída</option><option value="CONTACTED">Contactada</option><option value="QUALIFIED">Calificada</option><option value="CLOSED">Cerrada</option></StyledSelect></label><label className="block space-y-1 text-sm"><span>Seguimiento privado</span><textarea name="notes" rows={4} maxLength={15000} defaultValue={notes} className={inputClass} /></label><button className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{pending ? "Guardando…" : "Guardar seguimiento"}</button></fieldset>{message && <p role="status" className="text-sm">{message}</p>}</form>;
}
