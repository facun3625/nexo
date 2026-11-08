"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfirm } from "@/components/admin/confirm-provider";
import type { TelegramSettings } from "@/lib/settings";
import { removeTelegramSettings, sendTestTelegram, updateTelegramSettings } from "./actions";

export function TelegramSettingsForm({ settings }: { settings: TelegramSettings }) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState(settings.chatId ?? "");
  const [pending, startTransition] = useTransition();
  const [testPending, startTestTransition] = useTransition();
  const [removePending, startRemoveTransition] = useTransition();
  const confirm = useConfirm();

  function save() {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("botToken", botToken.trim());
        formData.set("chatId", chatId.trim());
        const actionResult = await updateTelegramSettings(formData);
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        setBotToken("");
        toast.success("Telegram guardado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  function sendTest() {
    startTestTransition(async () => {
      try {
        const actionResult = await sendTestTelegram(botToken, chatId);
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        toast.success("Mensaje de prueba enviado — revisá el grupo de Telegram");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo enviar el mensaje de prueba");
      }
    });
  }

  async function remove() {
    const ok = await confirm({
      title: "Quitar configuración de Telegram",
      description: "Se deja de avisar por Telegram cuando entra un pedido nuevo hasta que la vuelvas a cargar.",
      confirmLabel: "Quitar",
      destructive: true,
    });
    if (!ok) return;
    startRemoveTransition(async () => {
      try {
        const actionResult = await removeTelegramSettings();
        if ("error" in actionResult) {
          toast.error(actionResult.error);
          return;
        }
        setBotToken("");
        setChatId("");
        toast.success("Configuración de Telegram eliminada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo quitar");
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">
        Manda un aviso al grupo de Telegram del equipo apenas entra una consulta de una obra.
        Sin esto configurado, el sitio sigue funcionando normal, solo que no manda ese aviso.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tg-token">Token del bot</Label>
          <Input
            id="tg-token"
            type="password"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={settings.configured ? "•••••••• (guardado — dejalo vacío para no cambiarlo)" : "123456789:ABC..."}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="tg-chat">Chat ID del grupo</Label>
          <Input
            id="tg-chat"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="-1001234567890"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Creás el bot hablándole a <span className="font-medium text-foreground">@BotFather</span> en
        Telegram, lo agregás al grupo del equipo, y sacás el chat ID mandando un mensaje al grupo y
        abriendo <span className="font-mono">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span>.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={sendTest} disabled={testPending}>
          {testPending ? "Enviando..." : "Mandar mensaje de prueba"}
        </Button>
        {settings.configured && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={remove}
            disabled={removePending}
            className="text-destructive hover:text-destructive"
          >
            Quitar configuración
          </Button>
        )}
      </div>
    </div>
  );
}
