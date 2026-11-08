"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { money } from "@/lib/estate/modules";
import type { AssistantStatus } from "@/lib/ai-agent/status";

type AssistantProperty = {
  id: string;
  title: string;
  operation: string;
  price: number | null;
  currency: string;
  showPrice: boolean;
  city: string;
  neighborhood: string;
  bedrooms: number;
  image: string | null;
  href: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  properties?: AssistantProperty[];
};

const SESSION_KEY = "nexo_ai_session";
const MESSAGES_KEY = "nexo_ai_messages";
// Datos que el visitante dejó al abrir el chat (o "skipped" si prefirió no dejarlos) — se piden una sola vez por navegador.
const CONTACT_KEY = "nexo_ai_contact";

type StoredContact = { name: string; phone: string } | "skipped";

function readContact(): StoredContact | null {
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    if (!raw) return null;
    if (raw === "skipped") return "skipped";
    const parsed = JSON.parse(raw) as { name?: unknown; phone?: unknown };
    return typeof parsed.name === "string" && typeof parsed.phone === "string" ? { name: parsed.name, phone: parsed.phone } : null;
  } catch {
    return null;
  }
}

async function postContact(sessionIdValue: string, name: string, phone: string): Promise<string | null> {
  try {
    const response = await fetch("/api/estate-ai/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdValue, name, phone }),
    });
    if (response.ok) return null;
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    return data.error ?? "No pudimos guardar tus datos.";
  } catch {
    return "No pudimos guardar tus datos. Revisá tu conexión.";
  }
}

function sessionId(): string {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const created = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, created);
  return created;
}

function textOnly(messages: ChatMessage[]) {
  return messages.slice(-20).map(({ id, role, content }) => ({ id, role, content }));
}

export function AiAgentWidget({ status }: { status: AssistantStatus }) {
  const { data: authSession } = useSession();
  const [open, setOpen] = useState(false);
  // null = todavía no decidió (se le pide al abrir el chat); "skipped" = prefirió no dejar sus datos
  const [contact, setContact] = useState<StoredContact | null>(null);
  const [contactLoaded, setContactLoaded] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [savingContact, setSavingContact] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [liveStatus, setLiveStatus] = useState(status);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: status.welcomeMessage },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(MESSAGES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as unknown;
          if (Array.isArray(parsed)) {
            const valid = parsed.filter(
              (message): message is ChatMessage =>
                Boolean(message)
                && typeof message === "object"
                && typeof message.id === "string"
                && (message.role === "user" || message.role === "assistant")
                && typeof message.content === "string",
            );
            if (valid.length > 0) setMessages(valid.slice(-20));
          }
        }
      } catch {
        localStorage.removeItem(MESSAGES_KEY);
      } finally {
        // Quien ya venía conversando antes de que se pidieran los datos no vuelve a ver el pedido
        const stored = readContact();
        const storedMessages = localStorage.getItem(MESSAGES_KEY);
        const hadConversation = storedMessages ? (JSON.parse(storedMessages) as unknown[]).length > 1 : false;
        setContact(stored ?? (hadConversation ? "skipped" : null));
        setContactLoaded(true);
        setHistoryLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(textOnly(messages)));
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [historyLoaded, messages, sending]);

  useEffect(() => {
    let active = true;
    const refreshStatus = () => {
      fetch("/api/estate-ai/status", { cache: "no-store" })
        .then(async (response) => {
          if (active && response.ok) setLiveStatus(await response.json() as AssistantStatus);
        })
        .catch(() => {});
    };
    const interval = window.setInterval(refreshStatus, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || sending) return;

    setInput("");
    setError(null);
    setSending(true);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content }]);

    try {
      const response = await fetch("/api/estate-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionId(), message: content }),
      });
      const result = (await response.json()) as {
        message?: string;
        properties?: AssistantProperty[];
        error?: string;
      };
      if (!response.ok || !result.message) throw new Error(result.error || "No pude responder ahora.");
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", content: result.message as string, properties: result.properties },
      ]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No pude responder ahora.");
    } finally {
      setSending(false);
    }
  }

  // Nombre y teléfono para poder contactarlo si la IA no resuelve la consulta. Quedan guardados con la conversación.
  async function submitContact(event: FormEvent) {
    event.preventDefault();
    if (savingContact) return;
    setSavingContact(true);
    setContactError(null);
    const name = (contactName || (authSession?.user?.name ?? "")).trim();
    const failure = await postContact(sessionId(), name, contactPhone);
    setSavingContact(false);
    if (failure) {
      setContactError(failure);
      return;
    }
    localStorage.setItem(CONTACT_KEY, JSON.stringify({ name, phone: contactPhone.trim() }));
    setContact({ name, phone: contactPhone.trim() });
  }

  function skipContact() {
    localStorage.setItem(CONTACT_KEY, "skipped");
    setContact("skipped");
  }

  // "Nueva conversación" empieza de cero en este navegador; la anterior queda guardada en /admin/conversaciones.
  function clearChat() {
    localStorage.setItem(SESSION_KEY, crypto.randomUUID());
    localStorage.removeItem(MESSAGES_KEY);
    setMessages([{ id: "welcome", role: "assistant", content: liveStatus.welcomeMessage }]);
    setInput("");
    setError(null);
    if (contact && contact !== "skipped") void postContact(sessionId(), contact.name, contact.phone);
  }

  if (!liveStatus.enabled) {
    if (!liveStatus.humanSeller.enabled) return null;
    const commonClasses =
      "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-50 flex h-12 items-center gap-1.5 rounded-full px-3.5 text-white shadow-lg sm:right-5";

    if (liveStatus.humanSeller.available && liveStatus.humanSeller.whatsappUrl) {
      return (
        <a
          href={liveStatus.humanSeller.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className={`${commonClasses} bg-[#25D366] transition-transform hover:scale-105`}
        >
          <WhatsAppIcon className="h-5 w-5 shrink-0" />
          <span className="text-xs font-semibold">Escribinos</span>
        </a>
      );
    }

    return (
      <div
        title={`Atención por WhatsApp: ${liveStatus.humanSeller.scheduleText}`}
        className={`${commonClasses} cursor-default bg-[#25D366]/55`}
      >
        <WhatsAppIcon className="h-5 w-5 shrink-0" />
        <span className="text-xs font-semibold">Fuera de horario</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-50 sm:right-5">
      {open && (
        <section
          role="dialog"
          aria-label={liveStatus.name}
          className="absolute bottom-14 right-0 flex h-[min(560px,calc(100dvh-6.5rem))] w-[min(360px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
        >
          <header className="flex items-center gap-3 bg-primary px-3.5 py-3 text-primary-foreground">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20" aria-hidden="true">
              <WhatsAppIconFallback />
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold leading-tight">{liveStatus.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] opacity-85">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
                En línea
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={clearChat}
                disabled={sending}
                title="Empezar una conversación nueva"
                aria-label="Nueva conversación"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full opacity-90 transition-colors hover:bg-white/15 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M5.6 15a8 8 0 0 0 13.4 2.4L20 14M18.4 9A8 8 0 0 0 5 6.6L4 10" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar asistente"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-2xl leading-none opacity-90 transition-colors hover:bg-white/15 hover:opacity-100"
              >
                ×
              </button>
            </div>
          </header>

          <div className="flex-1 touch-pan-y space-y-3 overflow-y-auto overscroll-contain bg-muted/30 p-2.5 sm:p-3" aria-live="polite">
            {messages
              .filter((message) => !(message.id === "welcome" && (!contactLoaded || contact === null)))
              .map((message) => (
              <div key={message.id} className={message.role === "user" ? "ml-6 sm:ml-9" : "mr-3 sm:mr-5"}>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border bg-background text-foreground shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
                {message.properties && message.properties.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.properties.map((property) => (
                      <Link
                        key={property.id}
                        href={property.href}
                        target="_blank"
                        className="flex gap-2.5 rounded-xl border bg-background p-2 shadow-sm transition-colors hover:border-primary/40"
                      >
                        {property.image ? (
                          <Image src={property.image} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-xs font-semibold text-foreground">{property.title}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{property.neighborhood || property.city}</p>
                          <p className="mt-1 text-xs font-bold text-primary">
                            {property.showPrice && property.price != null ? money(property.price, property.currency) : "Consultar precio"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {contactLoaded && contact === null && messages.length <= 1 && (
              <form onSubmit={submitContact} className="mx-auto w-full rounded-2xl border bg-background p-3.5 shadow-sm">
                <p className="text-[13px] leading-snug text-foreground">Para retomar tu consulta si hace falta, ¿nos dejás tus datos?</p>
                <div className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={contactName || (authSession?.user?.name ?? "")}
                    onChange={(event) => setContactName(event.target.value.slice(0, 80))}
                    placeholder="Nombre"
                    autoComplete="name"
                    aria-label="Tu nombre"
                    required
                    className="h-10 w-full rounded-lg border bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-[13px]"
                  />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(event) => setContactPhone(event.target.value.slice(0, 30))}
                    placeholder="Teléfono con código de área"
                    autoComplete="tel"
                    aria-label="Tu teléfono"
                    inputMode="tel"
                    required
                    className="h-10 w-full rounded-lg border bg-background px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-[13px]"
                  />
                </div>
                {contactError && <p className="mt-2 rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">{contactError}</p>}
                <button
                  type="submit"
                  disabled={savingContact}
                  className="mt-3 h-10 w-full cursor-pointer rounded-full bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {savingContact ? "Guardando…" : "Continuar"}
                </button>
                <button type="button" onClick={skipContact} className="mt-2 block w-full cursor-pointer text-center text-[12px] text-muted-foreground transition-colors hover:text-foreground">
                  Ahora no
                </button>
                <p className="mt-2 border-t pt-2 text-[10.5px] leading-snug text-muted-foreground/80">Usamos tus datos solo para contactarte por esta consulta.</p>
              </form>
            )}
            {sending && (
              <div className="mr-16 w-fit rounded-2xl rounded-bl-sm bg-background px-3.5 py-2.5 text-sm text-muted-foreground shadow-sm">
                Buscando propiedades…
              </div>
            )}
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
            <div ref={endRef} />
          </div>

          {liveStatus.humanSeller.enabled && (
            <div className="border-t px-3 py-2">
              {liveStatus.humanSeller.available && liveStatus.humanSeller.whatsappUrl ? (
                <a
                  href={liveStatus.humanSeller.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-3 py-2 text-xs font-semibold text-white"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Hablar con una persona
                </a>
              ) : (
                <p className="text-center text-[11px] text-muted-foreground">
                  Atención humana: {liveStatus.humanSeller.scheduleText}. Ahora no disponible.
                </p>
              )}
            </div>
          )}

          <form onSubmit={sendMessage} className="flex items-end gap-2 border-t bg-background p-2.5 sm:p-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 600))}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              rows={1}
              maxLength={600}
              placeholder="Escribí tu consulta…"
              disabled={!contactLoaded || contact === null}
              aria-label="Mensaje"
              className="min-h-11 max-h-24 min-w-0 flex-1 resize-none rounded-xl border px-3 py-2.5 text-base text-foreground outline-none focus:border-primary sm:text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || contact === null}
              className="h-11 shrink-0 cursor-pointer rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Cerrar asistente" : `Abrir ${liveStatus.name}`}
        aria-expanded={open}
        className="flex h-12 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-3.5 text-primary-foreground shadow-lg ring-2 ring-background transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.4-4 8-9 8a10.5 10.5 0 0 1-4-.8L3 21l1.7-4A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
        </svg>
        <span className="text-xs font-semibold">¿Te ayudo?</span>
      </button>
    </div>
  );
}

function WhatsAppIconFallback() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.4-4 8-9 8a10.5 10.5 0 0 1-4-.8L3 21l1.7-4A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" />
    </svg>
  );
}
