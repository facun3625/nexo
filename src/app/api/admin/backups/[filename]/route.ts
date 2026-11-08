import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { auth } from "@/auth";
import { getCurrentTenant } from "@/lib/tenant";
import { resolveBackupFilePath } from "@/lib/backup";
import { logActivity } from "@/lib/activity-log";

// Descarga de una copia de seguridad desde Configuración. Solo un
// administrador: el archivo tiene la base de datos entera.
export async function GET(_req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const [session, tenant] = await Promise.all([auth(), getCurrentTenant()]);
  if (!tenant || session?.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    return new Response("No autorizado", { status: 401 });
  }
  const { filename } = await params;
  const filePath = resolveBackupFilePath(filename);
  if (!filePath) return new Response("Not found", { status: 404 });
  let size: number;
  try {
    size = (await stat(filePath)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }
  await logActivity(tenant.id, { entity: "configuracion", action: "BACKUP_DOWNLOAD", summary: `Descargó la copia de seguridad ${filename}` }, { user: session.user });
  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
  return new Response(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(size),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
