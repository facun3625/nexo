import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7 = new Date(today); last7.setDate(today.getDate() - 6);
    const last30 = new Date(today); last30.setDate(today.getDate() - 29);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // --- Total views & unique visitors ---
    const [totalViews, todayViews, weekViews, monthViews] = await Promise.all([
      prisma.pageView.count(),
      prisma.pageView.count({ where: { createdAt: { gte: today } } }),
      prisma.pageView.count({ where: { createdAt: { gte: last7 } } }),
      prisma.pageView.count({ where: { createdAt: { gte: thisMonth } } }),
    ]);

    // --- Unique visitors (distinct sessionIds) ---
    const [uniqueTotal, uniqueToday, uniqueWeek, uniqueMonth] = await Promise.all([
      prisma.pageView.findMany({ where: { sessionId: { not: null } }, select: { sessionId: true }, distinct: ["sessionId"] }),
      prisma.pageView.findMany({ where: { sessionId: { not: null }, createdAt: { gte: today } }, select: { sessionId: true }, distinct: ["sessionId"] }),
      prisma.pageView.findMany({ where: { sessionId: { not: null }, createdAt: { gte: last7 } }, select: { sessionId: true }, distinct: ["sessionId"] }),
      prisma.pageView.findMany({ where: { sessionId: { not: null }, createdAt: { gte: thisMonth } }, select: { sessionId: true }, distinct: ["sessionId"] }),
    ]);

    // --- Last 30 days chart data (views + unique per day) ---
    const allRecentViews = await prisma.pageView.findMany({
      where: { createdAt: { gte: last30 } },
      select: { createdAt: true, sessionId: true },
      orderBy: { createdAt: "asc" },
    });

    const chartMap: Record<string, { views: number; sessions: Set<string> }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(last30);
      d.setDate(last30.getDate() + i);
      const key = d.toISOString().split("T")[0];
      chartMap[key] = { views: 0, sessions: new Set() };
    }
    for (const v of allRecentViews) {
      const key = v.createdAt.toISOString().split("T")[0];
      if (chartMap[key]) {
        chartMap[key].views++;
        if (v.sessionId) chartMap[key].sessions.add(v.sessionId);
      }
    }
    const chartData = Object.entries(chartMap).map(([date, { views, sessions }]) => ({
      date,
      count: views,
      unique: sessions.size,
    }));

    // --- Most viewed properties ---
    const propertyViews = await prisma.pageView.findMany({
      where: { propertyId: { not: null } },
      select: { propertyId: true, sessionId: true },
    });
    const propertyCountMap: Record<string, { views: number; sessions: Set<string> }> = {};
    for (const v of propertyViews) {
      if (!v.propertyId) continue;
      if (!propertyCountMap[v.propertyId]) propertyCountMap[v.propertyId] = { views: 0, sessions: new Set() };
      propertyCountMap[v.propertyId].views++;
      if (v.sessionId) propertyCountMap[v.propertyId].sessions.add(v.sessionId);
    }
    const topPropertyIds = Object.entries(propertyCountMap)
      .sort((a, b) => b[1].views - a[1].views)
      .slice(0, 10)
      .map(([id]) => id);

    const topProperties = await prisma.property.findMany({
      where: { id: { in: topPropertyIds } },
      select: { id: true, title: true, city: true, type: true, price: true },
    });
    const topPropertiesWithCount = topProperties.map((p) => ({
      ...p,
      views: propertyCountMap[p.id]?.views || 0,
      uniqueVisitors: propertyCountMap[p.id]?.sessions.size || 0,
    })).sort((a, b) => b.views - a.views);

    // --- Views by page type ---
    const allViews = await prisma.pageView.findMany({ select: { path: true } });
    const pageTypeMap: Record<string, number> = {
      "Inicio": 0, "Propiedades": 0, "Propiedad (detalle)": 0,
      "Tasación": 0, "Nosotros": 0, "Mapa": 0, "Otras": 0,
    };
    for (const v of allViews) {
      if (v.path === "/" || v.path === "") pageTypeMap["Inicio"]++;
      else if (v.path === "/propiedades") pageTypeMap["Propiedades"]++;
      else if (v.path.startsWith("/propiedad/")) pageTypeMap["Propiedad (detalle)"]++;
      else if (v.path === "/tasacion") pageTypeMap["Tasación"]++;
      else if (v.path === "/nosotros") pageTypeMap["Nosotros"]++;
      else if (v.path === "/mapa") pageTypeMap["Mapa"]++;
      else pageTypeMap["Otras"]++;
    }
    const pageBreakdown = Object.entries(pageTypeMap)
      .filter(([, count]) => count > 0)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    // --- Recent activity ---
    const recentActivity = await prisma.pageView.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { path: true, createdAt: true, propertyId: true, sessionId: true },
    });

    return NextResponse.json({
      totalViews,
      todayViews,
      weekViews,
      monthViews,
      uniqueTotal: uniqueTotal.length,
      uniqueToday: uniqueToday.length,
      uniqueWeek: uniqueWeek.length,
      uniqueMonth: uniqueMonth.length,
      chartData,
      topProperties: topPropertiesWithCount,
      pageBreakdown,
      recentActivity,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
