"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WHATSAPP_TEMPLATES, WHATSAPP_TEMPLATE_IDS, type WhatsappTemplateId, type WhatsappTemplates } from "@/lib/whatsapp-templates";
import { saveWhatsappTemplate } from "./whatsapp-actions";

function TemplateCard({ id, value }: { id: WhatsappTemplateId; value: string }) {
  const def = WHATSAPP_TEMPLATES[id];
  const [text, setText] = useState(value);
  const [saved, setSaved] = useState(value);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      setError("");
      setJustSaved(false);
      const result = await saveWhatsappTemplate(id, text);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSaved(text.trim() || def.default);
      if (!text.trim()) setText(def.default);
      setJustSaved(true);
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">{def.label}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
      </div>
      <Textarea
        aria-label={def.label}
        value={text}
        rows={7}
        maxLength={1500}
        onChange={(e) => {
          setText(e.target.value);
          setJustSaved(false);
        }}
      />
      <div>
        <p className="text-xs font-medium text-muted-foreground">Se completan solos al enviar:</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {Object.entries(def.tokens).map(([token, help]) => (
            <li key={token}>
              <button
                type="button"
                title={help}
                onClick={() => setText((t) => `${t}${token}`)}
                className="rounded-md border bg-muted/50 px-2 py-0.5 font-mono text-xs hover:bg-muted"
              >
                {token}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={save} disabled={pending || text.trim() === saved.trim()}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </Button>
        {text !== def.default && (
          <Button type="button" variant="ghost" onClick={() => setText(def.default)} disabled={pending}>
            Volver al texto original
          </Button>
        )}
        {justSaved && (
          <span role="status" className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle2 className="size-4" />
            Guardado
          </span>
        )}
      </div>
    </section>
  );
}

export function WhatsappTemplatesForm({ templates }: { templates: WhatsappTemplates }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Estos son los mensajes que salen armados al tocar los botones de WhatsApp del panel. Hay un texto por tipo de envío,
        y es el mismo para todos los clientes.
      </p>
      {WHATSAPP_TEMPLATE_IDS.map((id) => (
        <TemplateCard key={id} id={id} value={templates[id]} />
      ))}
    </div>
  );
}
