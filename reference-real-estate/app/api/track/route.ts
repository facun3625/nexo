import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { path, propertyId, sessionId } = await req.json();
    if (!path) return NextResponse.json({ ok: false });

    await prisma.pageView.create({
      data: {
        path,
        propertyId: propertyId || null,
        sessionId: sessionId || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
