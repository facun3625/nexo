import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import { WhatsAppIcon } from "@/components/catalog/social-icons";
import { toWhatsAppMessageLink } from "@/lib/social-links";
import { getStoreSettings, getWhatsappTemplates } from "@/lib/settings";
import { renderWhatsappTemplate } from "@/lib/whatsapp-templates";
import { ConversationActions } from "../ConversationActions";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" });

function isLikelyPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export default async function AdminConversacionDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenant } = await requireTenantAdmin();
  const [{ storeName }, whatsappTemplates] = await Promise.all([getStoreSettings(tenant.id), getWhatsappTemplates(tenant.id)]);
  const conversation = await prisma.estateAiConversation.findUnique({
    where: { id, tenantId: tenant.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();

  const propertyIds = [...new Set(conversation.messages.flatMap((m) => m.propertyIds))];
  const properties = propertyIds.length
    ? await prisma.estateProperty.findMany({ where: { id: { in: propertyIds }, tenantId: tenant.id }, select: { id: true, title: true } })
    : [];
  const byId = new Map(properties.map((p) => [p.id, p]));

  const canWhatsApp = conversation.phone && isLikelyPhone(conversation.phone);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/conversaciones" className="text-xs font-semibold text-primary hover:underline">
        ← Conversaciones
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{conversation.name ?? "Anónimo"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Empezó el {dateFormatter.format(conversation.createdAt)} · última actividad{" "}
            {dateFormatter.format(conversation.lastMessageAt)} · {conversation.messages.length} mensajes
          </p>
          <dl className="mt-3 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Nombre:</dt>
              <dd>{conversation.name ?? "No lo dejó"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Teléfono:</dt>
              <dd>{conversation.phone ?? "No lo dejó"}</dd>
            </div>
          </dl>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          {canWhatsApp && (
            <a
              href={toWhatsAppMessageLink(conversation.phone!, renderWhatsappTemplate(whatsappTemplates.aiConversation, { nombre: conversation.name ?? "", inmobiliaria: storeName }))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Escribirle por WhatsApp
            </a>
          )}
          <ConversationActions id={conversation.id} handled={Boolean(conversation.handledAt)} />
          {conversation.handledAt && (
            <p className="text-xs text-muted-foreground">Atendida el {dateFormatter.format(conversation.handledAt)}</p>
          )}
        </div>
      </div>

      <div className="flex max-w-3xl flex-col gap-3 pb-8">
        {conversation.messages.length === 0 && (
          <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
            Dejó sus datos pero todavía no escribió ninguna consulta.
          </p>
        )}
        {conversation.messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "ml-10" : "mr-10"}>
            <div
              className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-background"
              }`}
            >
              {m.content}
            </div>
            {m.propertyIds.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Propiedades recomendadas:{" "}
                {m.propertyIds.map((pid, i) => {
                  const p = byId.get(pid);
                  return (
                    <span key={pid}>
                      {i > 0 && ", "}
                      {p ? (
                        <Link href={`/propiedades/${pid}`} target="_blank" className="font-medium text-primary hover:underline">
                          {p.title}
                        </Link>
                      ) : (
                        "una propiedad que ya no existe"
                      )}
                    </span>
                  );
                })}
              </p>
            )}
            <p className={`mt-1 text-[11px] text-muted-foreground ${m.role === "user" ? "text-right" : ""}`}>
              {m.role === "user" ? "Cliente" : "Asistente"} · {dateFormatter.format(m.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
