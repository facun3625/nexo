import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const requests = await (prisma as any).tasacionRequest.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const { address, propertyType, area, phone, email } = await req.json();
  if (!address || !propertyType || !phone || !email) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }
  const request = await (prisma as any).tasacionRequest.create({
    data: {
      address,
      propertyType,
      area: area ? parseFloat(area) : null,
      phone,
      email,
    },
  });
  return NextResponse.json(request);
}
