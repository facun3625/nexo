"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/estate/form-field-class";
import { StyledSelect } from "@/components/estate/styled-select";
import { useConfirm } from "@/components/admin/confirm-provider";
import type { SmtpSettings } from "@/lib/smtp-settings";
import { removeSmtpSettings, saveSmtpSettings, sendSmtpTest } from "./smtp-actions";

const PORT_FOR: Record<string, string> = { ssl: "465", starttls: "587", none: "25" };

export function SmtpSettingsForm({ settings, myEmail }: { settings: SmtpSettings; myEmail: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const formRef = useRef<HTMLFormElement>(null);
  const [saving, startSave] = useTransition();
  const [testing, startTest] = useTransition();
  const [security, setSecurity] = useState(settings.security);
  const [port, setPort] = useState(String(settings.port));
  const [testTo, setTestTo] = useState(myEmail);

  const label = "flex flex-col gap-1.5 text-xs font-medium";
  const form = () => new FormData(formRef.current!);

  return (
    <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-7">
      <div>
        <h2 className="font-semibold">Correo (SMTP)</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Por acá salen todos los mails de la app: email marketing, propiedades a clientes, recuperar contraseña y
          avisos. Usá los datos SMTP de la casilla del dominio (te los da el hosting o el proveedor del correo).
        </p>
        {settings.configured && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" /> Configurado: los mails salen desde {settings.fromEmail}
          </p>
        )}
      </div>

      <form
        ref={formRef}
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          startSave(async () => {
            const result = await saveSmtpSettings(form());
            if ("error" in result) toast.error(result.error);
            else {
              toast.success("Correo guardado");
              const pw = formRef.current?.elements.namedItem("password") as HTMLInputElement | null;
              if (pw) pw.value = "";
              router.refresh();
            }
          });
        }}
      >
        <label className={label}>
          Servidor SMTP
          <input name="host" className={inputClass} defaultValue={settings.host} placeholder="Ej: mail.tudominio.com.ar" required />
        </label>
        <div className="grid grid-cols-[1fr_110px] gap-3">
          <label className={label}>
            Seguridad
            <StyledSelect
              name="security"
              value={security}
              onChange={(e) => {
                const next = e.target.value as typeof security;
                setSecurity(next);
                if (Object.values(PORT_FOR).includes(port)) setPort(PORT_FOR[next]);
              }}
            >
              <option value="ssl">SSL/TLS (puerto 465)</option>
              <option value="starttls">STARTTLS (puerto 587)</option>
              <option value="none">Sin cifrado</option>
            </StyledSelect>
          </label>
          <label className={label}>
            Puerto
            <input name="port" className={inputClass} inputMode="numeric" value={port} onChange={(e) => setPort(e.target.value)} required />
          </label>
        </div>
        <label className={label}>
          Usuario
          <input name="user" className={inputClass} defaultValue={settings.user} placeholder="Casi siempre, el mail completo" autoComplete="off" />
        </label>
        <label className={label}>
          Contraseña
          <input
            name="password"
            type="password"
            className={inputClass}
            placeholder={settings.hasPassword ? "•••••••• (guardada, dejá vacío para no cambiarla)" : ""}
            autoComplete="new-password"
          />
        </label>
        <label className={label}>
          Mail remitente
          <input name="fromEmail" type="email" className={inputClass} defaultValue={settings.fromEmail} placeholder="Ej: info@tudominio.com.ar" required />
        </label>
        <label className={label}>
          Nombre remitente
          <input name="fromName" className={inputClass} defaultValue={settings.fromName} placeholder="Vacío = nombre de la inmobiliaria" />
        </label>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
          {settings.configured && (
            <Button
              type="button"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={saving}
              onClick={async () => {
                const ok = await confirm({
                  title: "Quitar correo",
                  description: "La app deja de poder mandar mails hasta que lo vuelvas a cargar.",
                  confirmLabel: "Quitar",
                  destructive: true,
                });
                if (!ok) return;
                startSave(async () => {
                  const result = await removeSmtpSettings();
                  if ("error" in result) toast.error(result.error);
                  else {
                    toast.success("Configuración quitada");
                    router.refresh();
                  }
                });
              }}
            >
              Quitar
            </Button>
          )}
        </div>
      </form>

      <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-end">
        <label className={`${label} flex-1`}>
          Probar: mandar un mail a
          <input className={inputClass} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
        </label>
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={testing || !testTo}
          onClick={() =>
            startTest(async () => {
              const result = await sendSmtpTest(form(), testTo);
              if ("error" in result) toast.error(result.error, { duration: 10000 });
              else toast.success(`Listo, revisá ${testTo} (y la carpeta de spam)`);
            })
          }
        >
          {testing && <Loader2 className="size-4 animate-spin" />}
          Enviar prueba
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        La prueba usa lo que está escrito arriba, aunque no lo hayas guardado. La contraseña se guarda cifrada.
      </p>
    </section>
  );
}
