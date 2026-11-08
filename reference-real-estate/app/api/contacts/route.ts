import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const contacts = await (prisma as any).contactRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const { nombre, telefono, email, consulta, source } = await req.json();
  const contact = await (prisma as any).contactRequest.create({
    data: { nombre, telefono: telefono || null, email: email || null, consulta: consulta || null, source: source || "chat" },
  });
  return NextResponse.json(contact);
}
