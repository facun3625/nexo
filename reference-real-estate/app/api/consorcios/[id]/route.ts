import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nombre, banco, titular, cuit, cbu, ca, order, active } = body;

    const consorcio = await prisma.consorcio.update({
      where: { id },
      data: {
        nombre,
        banco,
        titular,
        cuit,
        cbu,
        ca,
        order,
        active,
      },
    });

    await createAuditLog("UPDATE", "Consorcio", consorcio.id, { nombre: consorcio.nombre });

    return NextResponse.json(consorcio);
  } catch (error) {
    console.error("PATCH Consorcio Error:", error);
    return NextResponse.json({ error: "Error updating consorcio" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const consorcio = await prisma.consorcio.delete({ where: { id } });

    await createAuditLog("DELETE", "Consorcio", id, { nombre: consorcio.nombre });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Consorcio Error:", error);
    return NextResponse.json({ error: "Error deleting consorcio" }, { status: 500 });
  }
}
