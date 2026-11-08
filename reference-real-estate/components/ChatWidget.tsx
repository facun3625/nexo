"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_REPLIES = [
  "¿Qué propiedades tienen en alquiler?",
  "Busco casa para comprar en Santa Fe",
  "¿Cómo funciona una tasación?",
  "Quiero contactar a un asesor",
];

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy **Lena**, tu asesora inmobiliaria con IA de Penalva. Puedo ayudarte a encontrar propiedades, responder dudas sobre precios o coordinar una tasación. ¿Por dónde empezamos?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (pathname?.startsWith("/admin")) return null;
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasInteracted = messages.length > 1;

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  // Hide tooltip after 6s or when opened
  useEffect(() => {
    const t = setTimeout(() => setTooltipVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    if (inputRef.current) { inputRef.current.style.height = "auto"; }
    setTooltipVisible(false);

    const next: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply ?? "Sin respuesta." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Hubo un error. Intentá de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Render message with **bold** and [text](url) link support
  function renderMsg(text: string) {
    const tokens = text.split(/(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*)/g);
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < tokens.length) {
      const t = tokens[i];
      if (!t) { i++; continue; }
      if (t.startsWith("[") && t.includes("](")) {
        const label = tokens[i + 1];
        const href = tokens[i + 2];
        result.push(
          <a key={i} href={href} target="_blank" rel="noopener noreferrer"
            className="underline font-semibold"
            style={{ color: "#df691a" }}>
            {label}
          </a>
        );
        i += 3;
      } else if (t.startsWith("**") && t.endsWith("**")) {
        const inner = tokens[i + 1];
        result.push(<strong key={i}>{inner}</strong>);
        i += 2;
      } else {
        result.push(t);
        i++;
      }
    }
    return result;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* Chat panel */}
      {open && (
        <div
          className="flex flex-col rounded-2xl overflow-hidden shadow-2xl"
          style={{ width: 350, height: 520, background: "#1a1816", border: "1px solid #2e2c2a" }}
        >
          {/* Header */}
          <div className="px-4 py-3" style={{ background: "#df691a" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div
                    className="flex items-center justify-center rounded-full text-white font-bold text-[15px]"
                    style={{ width: 36, height: 36, background: "rgba(0,0,0,0.15)" }}
                  >
                    L
                  </div>
                  {/* Online dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#df691a]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-white font-bold text-[14px] leading-none">Lena</p>
                    <span
                      className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}
                    >
                      IA
                    </span>
                  </div>
                  <p className="text-orange-100 text-[11px] mt-0.5">Asesora · Penalva Inmobiliaria</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start items-end"}`}>
                {m.role === "assistant" && (
                  <div
                    className="flex items-center justify-center rounded-full text-white font-bold text-[11px] shrink-0 mb-0.5"
                    style={{ width: 24, height: 24, background: "#df691a" }}
                  >
                    L
                  </div>
                )}
                <div
                  className="text-[13px] px-3 py-2 rounded-xl max-w-[80%] leading-relaxed"
                  style={
                    m.role === "user"
                      ? { background: "#df691a", color: "#fff", borderBottomRightRadius: 4 }
                      : { background: "#2e2c2a", color: "#e5e0db", borderBottomLeftRadius: 4 }
                  }
                >
                  {renderMsg(m.content)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-end">
                <div className="flex items-center justify-center rounded-full text-white font-bold text-[11px] shrink-0"
                  style={{ width: 24, height: 24, background: "#df691a" }}>L</div>
                <div className="px-3 py-2.5 rounded-xl flex gap-1" style={{ background: "#2e2c2a", borderBottomLeftRadius: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies — solo antes de que el usuario interactúe */}
          {!hasInteracted && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  onClick={() => { setOpen(true); send(q); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border transition-colors"
                  style={{ background: "#242220", border: "1px solid #3a3836", color: "#b0a898" }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = "#df691a"; (e.target as HTMLElement).style.color = "#df691a"; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = "#3a3836"; (e.target as HTMLElement).style.color = "#b0a898"; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 px-3 py-3" style={{ borderTop: "1px solid #2e2c2a" }}>
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKey}
              placeholder="Escribí tu consulta…"
              className="flex-1 rounded-lg px-3 py-2 text-[13px] outline-none resize-none overflow-y-auto leading-relaxed"
              style={{ background: "#2e2c2a", color: "#e5e0db", border: "1px solid #3a3836", maxHeight: 120 }}
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center rounded-lg transition-opacity disabled:opacity-30"
              style={{ width: 36, height: 36, background: "#df691a" }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tooltip — aparece antes de abrir, solo si el botón no está visible */}
      {!open && tooltipVisible && (
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl shadow-lg cursor-pointer"
          style={{ background: "#1a1816", border: "1px solid #2e2c2a", maxWidth: 220 }}
          onClick={() => { setOpen(true); setTooltipVisible(false); }}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px]"
              style={{ background: "#df691a" }}>L</div>
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border-2 border-[#1a1816]" />
          </div>
          <div>
            <p className="text-white text-[12px] font-semibold leading-none">¿Puedo ayudarte?</p>
            <p className="text-gray-500 text-[11px] mt-0.5">Lena · Asesora IA</p>
          </div>
        </div>
      )}

      {/* Toggle button — solo cuando el chat está cerrado Y el tooltip ya desapareció */}
      {!open && !tooltipVisible && <button
        onClick={() => { setOpen(true); }}
        className="flex items-center gap-2 rounded-full shadow-lg transition-all hover:scale-105 pr-4"
        style={{ background: "#df691a", height: 52 }}
        aria-label="Abrir chat"
      >
        <div className="relative ml-1.5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[14px]"
            style={{ background: "rgba(0,0,0,0.15)" }}>
            {open ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : "L"}
          </div>
          {!open && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#df691a]" />}
        </div>
        {!open && (
          <div className="text-left">
            <p className="text-white font-bold text-[13px] leading-none">Lena</p>
            <p className="text-orange-200 text-[10px] mt-0.5">Asesora IA · En línea</p>
          </div>
        )}
      </button>}

    </div>
  );
}
