import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentTenant } from "@/lib/tenant";
import { logActivity } from "@/lib/activity-log";
import { saveUploadedFile } from "@/lib/storage";

const MAX_COVER_VIDEO_MB = 50;
const MAX_BYTES = MAX_COVER_VIDEO_MB * 1024 * 1024;
const KEY = "store_cover_video_url";

// Ruta y no server action: el navegador manda el archivo crudo y puede
// mostrar el avance de la subida. Solo administradores.
export async function POST(request: NextRequest) {
  const tenant = await getCurrentTenant();
  const session = await auth();
  if (!tenant || session?.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) {
    return NextResponse.json({ error: `El video puede pesar hasta ${MAX_COVER_VIDEO_MB} MB.` }, { status: 413 });
  }
  if (request.headers.get("content-type") !== "video/mp4") {
    return NextResponse.json({ error: "El video tiene que ser MP4." }, { status: 415 });
  }
  const buffer = await request.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: `El video puede pesar hasta ${MAX_COVER_VIDEO_MB} MB.` }, { status: 413 });
  }
  // Un MP4 real tiene «ftyp» en el byte 4; no alcanza con lo que declare el navegador.
  if (new TextDecoder().decode(buffer.slice(4, 8)) !== "ftyp") {
    return NextResponse.json({ error: "El archivo no es un MP4 válido." }, { status: 415 });
  }
  try {
    const url = await saveUploadedFile(new File([buffer], "portada.mp4", { type: "video/mp4" }), `${tenant.id}/branding`);
    await prisma.settings.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: KEY } },
      update: { value: url },
      create: { tenantId: tenant.id, key: KEY, value: url },
    });
    await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Cambió el video de portada" }, { user: session.user });
    revalidatePath("/", "layout");
    return NextResponse.json({ url });
  } catch (error) {
    console.error("cover video upload failed", error);
    return NextResponse.json({ error: "No se pudo subir el video. Probá de nuevo." }, { status: 500 });
  }
}

export async function DELETE() {
  const tenant = await getCurrentTenant();
  const session = await auth();
  if (!tenant || session?.user.role !== "ADMIN" || session.user.tenantId !== tenant.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  await prisma.settings.deleteMany({ where: { tenantId: tenant.id, key: KEY } });
  await logActivity(tenant.id, { entity: "pagina", action: "UPDATE", summary: "Quitó el video de portada" }, { user: session.user });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
