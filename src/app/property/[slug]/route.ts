import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";
import { getCurrentTenant } from "@/lib/tenant";
import { WORDPRESS_PROPERTY_CODES } from "@/lib/wordpress-redirects";

// Propiedades del WordPress anterior (/property/<slug>). La ficha nueva se busca
// por código; si ya no está publicada, se manda al listado en vez de a un 404.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const code = Object.hasOwn(WORDPRESS_PROPERTY_CODES, slug) ? WORDPRESS_PROPERTY_CODES[slug] : undefined;
  const tenant = code ? await getCurrentTenant() : null;
  const property =
    code && tenant
      ? await prisma.estateProperty.findFirst({
          where: { tenantId: tenant.id, code, published: true },
          select: { id: true },
        })
      : null;
  return NextResponse.redirect(`${SITE_URL}${property ? `/propiedades/${property.id}` : "/propiedades"}`, 301);
}
