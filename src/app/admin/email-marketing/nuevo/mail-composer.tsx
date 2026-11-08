"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Loader2,
  MonitorIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SmartphoneIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/estate/form-field-class";
import { SearchableSelect } from "@/components/estate/searchable-select";
import { useConfirm } from "@/components/admin/confirm-provider";
import { cn } from "@/lib/utils";
import {
  MAIL_TEMPLATES,
  MAX_MAIL_ITEMS,
  renderMarketingEmail,
  templateDef,
  type MailBrand,
  type MailContent,
  type MailItem,
  type MailTemplateId,
} from "@/lib/email-marketing/templates";
import { sendCampaign, sendTestEmail, sendToClient, type MailDraft } from "../actions";

type Contact = { id: string; name: string; email: string };
type Mode = "single" | "list";
type TextField = "subject" | "heading" | "intro" | "ctaLabel" | "signature";

function norm(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function MailComposer({
  brand,
  properties,
  developments,
  contacts,
  audience,
  myEmail,
  signature,
  initial,
}: {
  brand: MailBrand;
  properties: MailItem[];
  developments: MailItem[];
  contacts: Contact[];
  audience: { subscribers: number; withContacts: number };
  myEmail: string;
  signature: string;
  initial: { mode: Mode; propertyIds: string[]; contactId: string | null; email: string; name: string };
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [testing, startTest] = useTransition();

  const initialTemplate: MailTemplateId = initial.mode === "single" ? "cliente" : "novedades";
  const initialItems = initial.propertyIds
    .map((id) => properties.find((p) => p.id === id))
    .filter((p): p is MailItem => Boolean(p));
  const defaults = templateDef(initialTemplate).defaults(brand.storeName);
  const initialContact = contacts.find((c) => c.id === initial.contactId) ?? null;

  const [mode, setMode] = useState<Mode>(initial.mode);
  const [template, setTemplate] = useState<MailTemplateId>(initialTemplate);
  const [items, setItems] = useState<MailItem[]>(initialItems);
  const [fields, setFields] = useState<Record<TextField, string>>({
    ...defaults,
    subject: initialItems.length === 1 && initial.mode === "single" ? `Te comparto: ${initialItems[0].title}` : defaults.subject,
    signature,
  });
  const [ctaUrl, setCtaUrl] = useState(`${brand.siteUrl}/propiedades`);
  const [touched, setTouched] = useState<Set<TextField>>(new Set());
  const [recipient, setRecipient] = useState({ email: initialContact?.email ?? initial.email, name: initialContact?.name ?? initial.name });
  const [contactKey, setContactKey] = useState(0);
  const [includeContacts, setIncludeContacts] = useState(true);
  const [query, setQuery] = useState("");
  const [testTo, setTestTo] = useState(myEmail);
  const [mobile, setMobile] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const def = templateDef(template);
  const pool = def.itemKind === "property" ? properties : developments;
  const results = useMemo(() => {
    const q = norm(query.trim());
    return pool
      .filter((p) => !items.some((i) => i.id === p.id))
      .filter((p) => !q || norm(`${p.title} ${p.code ?? ""} ${p.location} ${p.operation ?? ""}`).includes(q))
      .slice(0, 30);
  }, [pool, query, items]);

  const content: MailContent = { template, ...fields, ctaUrl, items };
  const previewName = mode === "single" ? recipient.name || "" : "María";
  // Armar el HTML es solo concatenar texto: no hace falta memoizarlo.
  const html = renderMarketingEmail(content, brand, { recipientName: previewName, unsubscribeUrl: mode === "list" ? "#" : null });

  const draft: MailDraft = { ...fields, template, ctaUrl, items: items.map((i) => ({ kind: i.kind, id: i.id })) };
  const audienceCount = includeContacts ? audience.withContacts : audience.subscribers;

  function setField(field: TextField, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    setTouched((t) => new Set(t).add(field));
  }

  function chooseTemplate(id: MailTemplateId) {
    const next = templateDef(id);
    const d = next.defaults(brand.storeName);
    setTemplate(id);
    // Cambiar de plantilla no pisa lo que ya se escribió a mano.
    setFields((f) => ({
      ...f,
      subject: touched.has("subject") ? f.subject : d.subject,
      heading: touched.has("heading") ? f.heading : d.heading,
      intro: touched.has("intro") ? f.intro : d.intro,
      ctaLabel: touched.has("ctaLabel") ? f.ctaLabel : d.ctaLabel,
    }));
    if (next.itemKind !== def.itemKind) setItems([]);
    setCtaUrl(next.itemKind === "development" ? `${brand.siteUrl}/arquitectura/obras` : `${brand.siteUrl}/propiedades`);
  }

  function chooseMode(next: Mode) {
    setMode(next);
    if (next === "single" && template !== "cliente") chooseTemplate("cliente");
    if (next === "list" && template === "cliente") chooseTemplate("novedades");
  }

  function addItem(item: MailItem) {
    if (items.length >= MAX_MAIL_ITEMS) {
      toast.error(`Hasta ${MAX_MAIL_ITEMS} por mail`);
      return;
    }
    setItems((list) => [...list, item]);
    // "Cargar la propiedad" arma el asunto solo, para mandarlo en dos segundos.
    if (items.length === 0 && !touched.has("subject") && template === "cliente") {
      setFields((f) => ({ ...f, subject: `Te comparto: ${item.title}` }));
    }
  }

  function move(index: number, delta: number) {
    setItems((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  }

  async function send() {
    // La confirmación va antes de la transición: adentro, el diálogo no se
    // llega a mostrar hasta que la transición termina (y nunca termina).
    if (mode === "list") {
      const ok = await confirm({
        title: "Enviar a toda la lista",
        description: `Se va a enviar «${fields.subject}» a ${audienceCount} ${audienceCount === 1 ? "persona" : "personas"}. ¿Confirmás?`,
        confirmLabel: "Enviar",
      });
      if (!ok) return;
    }
    startTransition(async () => {
      if (mode === "single") {
        if (!recipient.email.trim()) {
          toast.error("Elegí un cliente o escribí un mail");
          return;
        }
        const result = await sendToClient(draft, recipient);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        toast.success(`Mail enviado a ${recipient.name || recipient.email}`);
        setSentTo(recipient.name || recipient.email);
        setRecipient({ email: "", name: "" });
        setContactKey((k) => k + 1);
        router.refresh();
        return;
      }
      const result = await sendCampaign(draft, includeContacts);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Envío en marcha: se manda en segundo plano");
      router.push(`/admin/email-marketing/${result.id}`);
    });
  }

  function test() {
    startTest(async () => {
      const result = await sendTestEmail(draft, testTo);
      if ("error" in result) toast.error(result.error);
      else toast.success(`Prueba enviada a ${testTo}`);
    });
  }

  const label = "flex flex-col gap-1.5 text-xs font-medium";
  const card = "flex flex-col gap-4 rounded-2xl border bg-card p-5";

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-5">
        {/* 1. Destinatario */}
        <section className={card}>
          <h2 className="text-sm font-semibold">1. ¿A quién se lo mandás?</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {([
              { id: "single", icon: UserIcon, title: "A un cliente", text: "Sale al instante, con su nombre" },
              { id: "list", icon: UsersIcon, title: "A toda la lista", text: `${audience.withContacts} personas con mail` },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => chooseMode(m.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                  mode === m.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                )}
              >
                <m.icon className={cn("mt-0.5 size-4 shrink-0", mode === m.id ? "text-primary" : "text-muted-foreground")} />
                <span>
                  <span className="block text-sm font-semibold">{m.title}</span>
                  <span className="block text-xs text-muted-foreground">{m.text}</span>
                </span>
              </button>
            ))}
          </div>

          {mode === "single" ? (
            <div className="flex flex-col gap-3">
              <label className={label}>
                Cliente del panel
                <SearchableSelect
                  key={contactKey}
                  name="contact"
                  placeholder="Buscá por nombre o mail…"
                  defaultValue={initialContact && contactKey === 0 ? initialContact.id : ""}
                  options={contacts.map((c) => ({ id: c.id, label: `${c.name} — ${c.email}` }))}
                  onChange={(id) => {
                    const c = contacts.find((x) => x.id === id);
                    if (c) setRecipient({ email: c.email, name: c.name });
                    setSentTo(null);
                  }}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={label}>
                  Mail
                  <input
                    className={inputClass}
                    type="email"
                    value={recipient.email}
                    placeholder="o escribí un mail"
                    onChange={(e) => {
                      setRecipient((r) => ({ ...r, email: e.target.value }));
                      setSentTo(null);
                    }}
                  />
                </label>
                <label className={label}>
                  Nombre (para el saludo)
                  <input
                    className={inputClass}
                    value={recipient.name}
                    placeholder="Ej: María"
                    onChange={(e) => setRecipient((r) => ({ ...r, name: e.target.value }))}
                  />
                </label>
              </div>
              {sentTo && (
                <p className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Enviado a {sentTo}. Podés elegir otro cliente y mandarle lo mismo.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 accent-primary"
                  checked={includeContacts}
                  onChange={(e) => setIncludeContacts(e.target.checked)}
                />
                <span>
                  Incluir clientes y contactos del panel que tengan mail
                  <span className="block text-xs text-muted-foreground">
                    Si no, solo a quienes se suscribieron ({audience.subscribers}).
                  </span>
                </span>
              </label>
              <p className="font-semibold">
                Se envía a {audienceCount} {audienceCount === 1 ? "persona" : "personas"}
                <span className="font-normal text-muted-foreground"> · nadie que se haya dado de baja</span>
              </p>
            </div>
          )}
        </section>

        {/* 2. Plantilla */}
        <section className={card}>
          <h2 className="text-sm font-semibold">2. Plantilla</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {MAIL_TEMPLATES.filter((t) => (mode === "single" ? t.id !== "obras" : t.id !== "cliente")).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => chooseTemplate(t.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition",
                  template === t.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                )}
              >
                <span className="block text-sm font-semibold">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Propiedades */}
        <section className={card}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">3. {def.itemKind === "property" ? "Propiedades" : "Obras"}</h2>
            <span className="text-xs text-muted-foreground">
              {items.length}/{MAX_MAIL_ITEMS}
            </span>
          </div>

          {items.length > 0 && (
            <ul className="flex flex-col gap-2">
              {items.map((item, i) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border p-2 pr-1">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="size-12 shrink-0 rounded-lg bg-muted" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{[item.price, item.location].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex shrink-0">
                    <Button type="button" size="icon-sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir">
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Bajar">
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => setItems((l) => l.filter((x) => x.id !== item.id))} aria-label="Quitar">
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className={cn(inputClass, "pl-9")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={def.itemKind === "property" ? "Buscá por título, código, barrio…" : "Buscá una obra…"}
            />
          </div>
          <ul className="flex max-h-72 flex-col overflow-y-auto rounded-xl border">
            {results.length === 0 ? (
              <li className="p-4 text-center text-xs text-muted-foreground">
                {pool.length === 0 ? "No hay publicaciones activas para agregar." : "No hay resultados."}
              </li>
            ) : (
              results.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    className="flex w-full items-center gap-3 border-b p-2 text-left last:border-b-0 hover:bg-muted/50"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" loading="lazy" className="size-10 shrink-0 rounded-md object-cover" />
                    ) : (
                      <span className="size-10 shrink-0 rounded-md bg-muted" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{item.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[item.code ? `Cód. ${item.code}` : null, item.price, item.location].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <PlusIcon className="size-4 shrink-0 text-primary" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* 4. Texto */}
        <section className={card}>
          <h2 className="text-sm font-semibold">4. Texto del mail</h2>
          <label className={label}>
            Asunto
            <input className={inputClass} value={fields.subject} onChange={(e) => setField("subject", e.target.value)} maxLength={150} />
          </label>
          <label className={label}>
            Título
            <input className={inputClass} value={fields.heading} onChange={(e) => setField("heading", e.target.value)} maxLength={150} />
          </label>
          <label className={label}>
            Texto
            <textarea
              className={cn(inputClass, "min-h-28")}
              value={fields.intro}
              onChange={(e) => setField("intro", e.target.value)}
              maxLength={4000}
            />
            <span className="font-normal text-muted-foreground">
              <code className="rounded bg-muted px-1">{"{{nombre}}"}</code> se reemplaza por el nombre de cada persona. Dejá una línea en blanco para separar párrafos.
            </span>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={label}>
              Botón final (vacío = sin botón)
              <input className={inputClass} value={fields.ctaLabel} onChange={(e) => setField("ctaLabel", e.target.value)} maxLength={60} />
            </label>
            <label className={label}>
              Link del botón
              <input className={inputClass} value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} maxLength={500} />
            </label>
          </div>
          <label className={label}>
            Firma
            <textarea className={cn(inputClass, "min-h-16")} value={fields.signature} onChange={(e) => setField("signature", e.target.value)} maxLength={500} />
          </label>
        </section>

        {/* 5. Enviar */}
        <section className={cn(card, "sticky bottom-3 z-10 shadow-lg")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className={cn(label, "flex-1")}>
              Mandarme una prueba a
              <input className={inputClass} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            </label>
            <Button type="button" variant="outline" disabled={testing || pending || !testTo} onClick={test} className="h-10">
              {testing && <Loader2 className="size-4 animate-spin" />}
              Enviar prueba
            </Button>
          </div>
          <Button type="button" size="lg" disabled={pending} onClick={send} className="h-12 text-base">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
            {mode === "single"
              ? `Enviar a ${recipient.name || recipient.email || "el cliente"}`
              : `Enviar a ${audienceCount} ${audienceCount === 1 ? "persona" : "personas"}`}
          </Button>
        </section>
      </div>

      {/* Vista previa */}
      <div className="flex min-w-0 flex-col gap-3 xl:sticky xl:top-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Vista previa</h2>
          <div className="flex rounded-lg border p-0.5">
            <Button type="button" size="sm" variant={mobile ? "ghost" : "secondary"} onClick={() => setMobile(false)} aria-label="Computadora">
              <MonitorIcon className="size-4" />
            </Button>
            <Button type="button" size="sm" variant={mobile ? "secondary" : "ghost"} onClick={() => setMobile(true)} aria-label="Celular">
              <SmartphoneIcon className="size-4" />
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border bg-muted/40 p-3">
          <p className="mb-2 truncate px-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Asunto:</span> {fields.subject.replaceAll("{{nombre}}", previewName.split(" ")[0] ?? "")}
          </p>
          <iframe
            title="Vista previa del mail"
            srcDoc={html}
            sandbox=""
            className={cn("mx-auto block h-[75vh] w-full rounded-xl border bg-white transition-all", mobile && "max-w-[390px]")}
          />
        </div>
      </div>
    </div>
  );
}
