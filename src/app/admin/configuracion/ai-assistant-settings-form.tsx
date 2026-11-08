"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { AiAssistantSettings } from "@/lib/settings";
import { DEFAULT_AI_MODELS } from "@/lib/ai-agent/types";
import { updateAiProviderSettings, updateAiAssistantSettings } from "./actions";

const WEEK_DAYS = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function AiAssistantSettingsForm({ settings }: { settings: AiAssistantSettings }) {
  // ---- Proveedor técnico ----
  const [provider, setProvider] = useState(settings.provider ?? "");
  const [model, setModel] = useState(settings.model ?? "");
  const [apiKey, setApiKey] = useState("");
  const [providerPending, startProviderTransition] = useTransition();

  // ---- Identidad, instrucciones y horario ----
  const [enabled, setEnabled] = useState(settings.enabled);
  const [name, setName] = useState(settings.name);
  const [welcomeMessage, setWelcomeMessage] = useState(settings.welcomeMessage);
  const [instructions, setInstructions] = useState(settings.instructions ?? "");
  const [humanDays, setHumanDays] = useState<number[]>(settings.humanDays);
  const [humanStartTime, setHumanStartTime] = useState(settings.humanStartTime);
  const [humanEndTime, setHumanEndTime] = useState(settings.humanEndTime);
  const [assistantPending, startAssistantTransition] = useTransition();

  function saveProvider() {
    startProviderTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("provider", provider);
        formData.set("apiKey", apiKey.trim());
        formData.set("model", model.trim());
        const actionResult = await updateAiProviderSettings(formData);
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        setApiKey("");
        toast.success("Proveedor de IA guardado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  function saveAssistant() {
    startAssistantTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("enabled", String(enabled));
        formData.set("name", name.trim());
        formData.set("welcomeMessage", welcomeMessage.trim());
        formData.set("instructions", instructions.trim());
        formData.set("humanStartTime", humanStartTime);
        formData.set("humanEndTime", humanEndTime);
        for (const day of humanDays) formData.append("humanDays", String(day));
        const actionResult = await updateAiAssistantSettings(formData);
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        toast.success("Agente IA guardado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  function toggleDay(day: number) {
    setHumanDays((current) =>
      current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort(),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5 rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Proveedor de IA</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Con qué servicio funciona el asistente: proveedor, modelo y API key. La clave se usa solo en
            el servidor y nunca se envía al navegador.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-provider">Proveedor</Label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value as "" | "openai" | "gemini")}
              className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Elegir más adelante</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-model">Modelo</Label>
            <Input
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider ? DEFAULT_AI_MODELS[provider as "openai" | "gemini"] : "Se completa según el proveedor"}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-key">API key del proveedor</Label>
          <Input
            id="ai-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings.apiKey ? "•••••••• (guardada — dejalo vacío para no cambiarla)" : "Pegá la clave privada"}
          />
        </div>
        <div>
          <Button type="button" size="sm" onClick={saveProvider} disabled={providerPending}>
            {providerPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Asistente virtual</p>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              Recomienda propiedades consultando el catálogo real. Mientras está apagado (o falta
              configurarlo), el sitio muestra en su lugar un botón directo de WhatsApp si hay horario cargado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={(checked) => setEnabled(Boolean(checked))} />
            <span className="text-sm">Habilitado</span>
          </div>
        </div>

        {(!settings.provider || !settings.apiKey) && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
            El asistente todavía requiere la configuración técnica de arriba (proveedor + API key).
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-name">Nombre visible</Label>
            <Input id="ai-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ai-welcome">Mensaje de bienvenida</Label>
            <Input id="ai-welcome" value={welcomeMessage} maxLength={500} onChange={(e) => setWelcomeMessage(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="ai-instructions">Instrucciones para vender</Label>
          <Textarea
            id="ai-instructions"
            rows={6}
            maxLength={6000}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder={"Ejemplo:\n- Priorizá las propiedades destacadas.\n- Preguntá si busca comprar o alquilar.\n- Mantené un tono cercano y profesional."}
          />
          <p className="text-xs text-muted-foreground">
            No hace falta copiar dirección, contacto ni horarios: el asistente los consulta automáticamente
            desde Identidad y el horario configurado abajo.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t pt-4">
          <p className="text-sm font-medium">Horario de WhatsApp</p>
          <p className="text-xs text-muted-foreground">
            Días y horario en que se ofrece hablar por WhatsApp con una persona: como opción dentro del chat
            del asistente, o como botón directo mientras el asistente esté apagado.
          </p>
          <div className="flex flex-wrap gap-2">
            {WEEK_DAYS.map((day) => (
              <label key={day.value} className="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium">
                <Checkbox checked={humanDays.includes(day.value)} onCheckedChange={() => toggleDay(day.value)} />
                {day.label}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex w-36 flex-col gap-2">
              <Label htmlFor="ai-start">Desde</Label>
              <Input id="ai-start" type="time" value={humanStartTime} onChange={(e) => setHumanStartTime(e.target.value)} />
            </div>
            <div className="flex w-36 flex-col gap-2">
              <Label htmlFor="ai-end">Hasta</Label>
              <Input id="ai-end" type="time" value={humanEndTime} onChange={(e) => setHumanEndTime(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <Button type="button" size="sm" onClick={saveAssistant} disabled={assistantPending}>
            {assistantPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
