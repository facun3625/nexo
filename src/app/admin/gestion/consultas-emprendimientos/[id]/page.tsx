import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ExternalLink, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import {
  INQUIRY_STATUS_COLORS,
  INQUIRY_STATUS_LABELS,
} from "@/lib/inquiry-status";
import { DevelopmentInquiryEditor } from "../inquiry-editor";

type Answer = { label: string; value: string };
const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});
export default async function DevelopmentInquiryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant } = await requireTenantAdmin();
  const { id } = await params;
  let inquiry = await prisma.estateDevelopmentInquiry.findUnique({
    where: { id, tenantId: tenant.id },
    include: { events: { orderBy: { createdAt: "desc" } } },
  });
  if (!inquiry) notFound();
  if (inquiry.status === "NEW") {
    const [updated, event] = await prisma.$transaction([
      prisma.estateDevelopmentInquiry.update({
        where: { id, tenantId: tenant.id },
        data: { status: "IN_PROGRESS" },
      }),
      prisma.estateDevelopmentInquiryEvent.create({
        data: { inquiryId: id, status: "IN_PROGRESS" },
      }),
    ]);
    inquiry = { ...updated, events: [event, ...inquiry.events] };
  }
  const answers = inquiry.answers as unknown as Answer[];
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <Link
        href="/admin/gestion/consultas-emprendimientos"
        className="flex items-center gap-1.5 self-start text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a consultas
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">
              {inquiry.developmentName}
            </h1>
            <Badge className={INQUIRY_STATUS_COLORS[inquiry.status]}>
              {INQUIRY_STATUS_LABELS[inquiry.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Recibida el {dateFormatter.format(inquiry.createdAt)}
          </p>
        </div>
        {inquiry.developmentId && (
          <Link
            href={`/admin/gestion/emprendimientos/${inquiry.developmentId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary"
          >
            Ver obra <ExternalLink className="size-4" />
          </Link>
        )}
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <section className="rounded-xl border p-5">
            <h2 className="mb-4 font-semibold">Respuestas recibidas</h2>
            <dl className="divide-y">
              {answers.map((answer, index) => (
                <div
                  key={`${answer.label}-${index}`}
                  className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[180px_1fr]"
                >
                  <dt className="text-sm text-muted-foreground">
                    {answer.label}
                  </dt>
                  <dd className="whitespace-pre-wrap text-sm font-medium">
                    {answer.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section className="rounded-xl border p-5">
            <h2 className="mb-3 font-semibold">Avisos</h2>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                {inquiry.telegramSent ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <XCircle className="size-4 text-muted-foreground" />
                )}
                Telegram
              </span>
              <span className="flex items-center gap-2">
                {inquiry.emailSent ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <XCircle className="size-4 text-muted-foreground" />
                )}
                Email
              </span>
            </div>
            {inquiry.notificationError && (
              <p className="mt-3 text-xs text-destructive">
                {inquiry.notificationError}
              </p>
            )}
          </section>
          <section className="rounded-xl border p-5">
            <h2 className="mb-3 font-semibold">Historial</h2>
            <div className="space-y-3">
              {inquiry.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-3 border-l-2 border-muted pl-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {INQUIRY_STATUS_LABELS[event.status]}
                    </p>
                    {event.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {event.notes}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {dateFormatter.format(event.createdAt)}
                  </time>
                </div>
              ))}
            </div>
          </section>
        </div>
        <DevelopmentInquiryEditor
          id={id}
          initialStatus={inquiry.status}
          internalNotes={inquiry.internalNotes ?? ""}
        />
      </div>
    </div>
  );
}
