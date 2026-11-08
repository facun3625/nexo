"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { inputClass } from "./form-field-class";

type Sender = "STAFF" | "OWNER" | "PROVIDER";
type Message = {
  id: string;
  sender: Sender;
  senderName: string;
  body: string;
  createdAt: string;
};
type ActionResult = { ok: true } | { error: string };

export function PostSaleClaimChat({
  claimId,
  messages,
  viewerSide,
  action,
}: {
  claimId: string;
  messages: Message[];
  viewerSide: Sender;
  action: (claimId: string, form: FormData) => Promise<ActionResult>;
}) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto rounded-xl border bg-muted/20 p-3">
        {messages.map((m) => {
          const own = m.sender === viewerSide;
          return (
            <div key={m.id} className={`flex flex-col ${own ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  own ? "bg-primary text-primary-foreground" : "bg-card border"
                }`}
              >
                {m.body}
              </div>
              <p className="mt-0.5 px-1 text-[11px] text-muted-foreground">
                {m.senderName} ·{" "}
                {new Intl.DateTimeFormat("es-AR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "America/Argentina/Cordoba",
                }).format(new Date(m.createdAt))}
              </p>
            </div>
          );
        })}
        {!messages.length && (
          <p className="py-6 text-center text-sm text-muted-foreground">Todavía no hay mensajes.</p>
        )}
      </div>

      <form
        ref={formRef}
        className="flex items-end gap-2"
        action={(form) =>
          start(async () => {
            setMessage("");
            const result = await action(claimId, form);
            if (!("error" in result)) {
              formRef.current?.reset();
              router.refresh();
            }
          })
        }
      >
        <textarea
          name="body"
          required
          rows={2}
          maxLength={2000}
          placeholder="Escribí un mensaje…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} flex-1 resize-none`}
        />
        <button
          disabled={pending || !message.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          {pending ? "Enviando…" : "Enviar"}
        </button>
      </form>
    </div>
  );
}
