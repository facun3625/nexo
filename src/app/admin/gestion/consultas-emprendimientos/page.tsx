import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/require-admin";
import {
  INQUIRY_STATUS_COLORS,
  INQUIRY_STATUS_LABELS,
} from "@/lib/inquiry-status";

type Answer = { label: string; value: string };
const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});
export default async function DevelopmentInquiriesPage() {
  const { tenant } = await requireTenantAdmin();
  const inquiries = await prisma.estateDevelopmentInquiry.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Consultas de obras</h1>
        <p className="text-sm text-muted-foreground">
          Seguimiento de interesados y proyecto desde el que consultaron.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {inquiries.map((inquiry) => {
          const answers = inquiry.answers as unknown as Answer[];
          return (
            <Link
              key={inquiry.id}
              href={`/admin/gestion/consultas-emprendimientos/${inquiry.id}`}
              className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-semibold">
                    {inquiry.developmentName}
                  </h2>
                  <Badge className={INQUIRY_STATUS_COLORS[inquiry.status]}>
                    {INQUIRY_STATUS_LABELS[inquiry.status]}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {answers
                    .slice(0, 3)
                    .map((answer) => answer.value)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dateFormatter.format(inquiry.createdAt)}
                </p>
              </div>
            </Link>
          );
        })}
        {!inquiries.length && (
          <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Todavía no recibiste consultas de obras.
          </p>
        )}
      </div>
    </div>
  );
}
