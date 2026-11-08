import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    let config = await prisma.siteConfig.findUnique({
      where: { id: "singleton" },
    });

    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          id: "singleton",
          facebook: "",
          instagram: "",
          whatsapp: "",
          phone: "",
          email: "administracion@penalvainmobiliaria.com.ar",
          address: "Eva Perón 2845 — Santa Fe, Argentina",
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const config = await prisma.siteConfig.upsert({
      where: { id: "singleton" },
      update: {
        facebook: data.facebook,
        instagram: data.instagram,
        whatsapp: data.whatsapp,
        phone: data.phone,
        email: data.email,
        address: data.address,
        metaDescription: data.metaDescription || null,
        ogImage: data.ogImage || null,
      },
      create: {
        id: "singleton",
        facebook: data.facebook,
        instagram: data.instagram,
        whatsapp: data.whatsapp,
        phone: data.phone,
        email: data.email,
        address: data.address,
        metaDescription: data.metaDescription || null,
        ogImage: data.ogImage || null,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
