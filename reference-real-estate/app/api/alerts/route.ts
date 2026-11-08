import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const alerts = await prisma.propertyAlert.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(alerts);
}

export async function POST(req: Request) {
  const { nombre, email, ciudad, tipo, operacion, dormitorios } = await req.json();

  if (!nombre?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 });
  }

  const alert = await prisma.propertyAlert.create({
    data: {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      ciudad: ciudad || null,
      tipo: tipo || null,
      operacion: operacion || null,
      dormitorios: dormitorios ? parseInt(dormitorios) : null,
    },
  });

  return NextResponse.json(alert);
}
