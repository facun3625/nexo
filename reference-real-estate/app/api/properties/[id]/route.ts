import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { checkAlertsForProperty } from "@/lib/alerts";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(property);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: any = {};
    const fields = ["title","description","price","city","address","lat","lng","imageUrl","images","videoUrl","type","propertyType","bedrooms","bathrooms","hasGarage","garages","coveredArea","totalArea","featured","published","currency","pricePerMonth"];

    for (const f of fields) {
      if (!(f in body)) continue;
      const v = body[f];
      if (f === "price") data[f] = parseFloat(v) || 0;
      else if (["bedrooms","bathrooms","garages"].includes(f)) data[f] = v ? parseInt(v) : null;
      else if (["coveredArea","totalArea"].includes(f)) data[f] = v ? parseFloat(v) : null;
      else if (["lat","lng"].includes(f)) data[f] = v !== "" && v !== null && v !== undefined ? parseFloat(v) : null;
      else if (["hasGarage","featured","published","pricePerMonth"].includes(f)) data[f] = Boolean(v);
      else data[f] = v ?? null;
    }

    const prev = await prisma.property.findUnique({ where: { id }, select: { published: true } });
    const property = await prisma.property.update({ where: { id }, data });
    await createAuditLog("UPDATE", "Property", property.id, { title: property.title });

    // Si se acaba de publicar, verificar alertas
    if (data.published === true && prev?.published === false) {
      await checkAlertsForProperty(property);
    }

    return NextResponse.json(property);
  } catch (e: any) {
    console.error("PATCH property error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.property.delete({ where: { id } });
  await createAuditLog("DELETE", "Property", id);
  return NextResponse.json({ ok: true });
}
