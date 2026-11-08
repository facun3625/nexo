import { inquiryChannelFor } from "@/lib/estate/inquiry-channels";
import { getDroppedPriceAlerts } from "@/lib/estate/price-alerts";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar, type AdminNotification } from "@/components/admin/admin-topbar";
import { AdminThemeRoot } from "@/components/admin/admin-theme-root";
import { ConfirmProvider } from "@/components/admin/confirm-provider";
import { PromptProvider } from "@/components/admin/prompt-provider";
import { PwaProvider } from "@/components/admin/pwa-provider";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminWithPlan } from "@/lib/require-admin";
import { getCurrentTenant } from "@/lib/tenant";
import { getStoreSettings } from "@/lib/settings";

// `icons` del hijo reemplaza entero al del layout raíz (no se mezcla), así
// que si acá solo se definiera `apple`, el panel se quedaba sin favicon y el
// navegador mostraba otro. Se repite el favicon del sitio.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  const faviconUrl = tenant ? (await getStoreSettings(tenant.id)).faviconUrl : null;
  return {
    manifest: "/admin/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
    icons: {
      icon: faviconUrl ?? "/admin/icon/48",
      apple: "/admin/icon/180",
    },
  };
}

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, tenant, permissions } = await requireTenantAdminWithPlan();

  const [newInquiryCount, newDevelopmentInquiryCount, newAiConversationCount, recentInquiries, recentDevelopmentInquiries, recentAiConversations] = await Promise.all([
    prisma.estateInquiry.count({where:{tenantId:tenant.id,status:"NEW"}}),
    prisma.estateDevelopmentInquiry.count({where:{tenantId:tenant.id,status:"NEW"}}),
    prisma.estateAiConversation.count({where:{tenantId:tenant.id,phone:{not:null},handledAt:null}}),
    prisma.estateInquiry.findMany({where:{tenantId:tenant.id,status:"NEW"},include:{contact:true},orderBy:{createdAt:"desc"},take:5}),
    prisma.estateDevelopmentInquiry.findMany({where:{tenantId:tenant.id,status:"NEW"},orderBy:{createdAt:"desc"},take:5}),
    prisma.estateAiConversation.findMany({where:{tenantId:tenant.id,phone:{not:null},handledAt:null},orderBy:{lastMessageAt:"desc"},take:5}),
  ]);

  const [droppedAlerts, newQrVisitCount, recentQrVisits] = await Promise.all([
    getDroppedPriceAlerts(tenant.id),
    prisma.estateQrVisit.count({where:{tenantId:tenant.id,handledAt:null}}),
    prisma.estateQrVisit.findMany({where:{tenantId:tenant.id,handledAt:null},include:{property:{select:{title:true}}},orderBy:{createdAt:"desc"},take:5}),
  ]);
  const priceDropCount = droppedAlerts.length;

  const notifications: AdminNotification[] = [
    ...recentQrVisits.map(item=>({id:item.id,type:"QR_VISIT" as const,title:`Abrió el QR: ${item.firstName} ${item.lastName}`,detail:item.property.title,href:"/admin/gestion/aperturas-qr",createdAt:item.createdAt.toISOString()})),
    ...droppedAlerts.slice(0,5).map(item=>({id:item.id,type:"PRICE_DROP" as const,title:`Avisar baja de precio: ${item.name}`,detail:item.property.title,href:"/admin/gestion/avisos-precio",createdAt:(item.notifiedAt ?? item.createdAt).toISOString()})),
    ...recentInquiries.map(item=>({id:item.id,type:"INQUIRY" as const,title:"Nueva consulta inmobiliaria",detail:item.contact.name,href:`/admin/gestion/consultas?channel=${inquiryChannelFor(item)}&edit=${item.id}`,createdAt:item.createdAt.toISOString()})),
    ...recentDevelopmentInquiries.map(item=>{
      const answers = item.answers as unknown as { label: string; value: string }[];
      const detail = Array.isArray(answers) ? answers.slice(0,2).map(a=>a.value).join(" · ") : item.developmentName;
      return {id:item.id,type:"DEVELOPMENT_INQUIRY" as const,title:`Consulta — ${item.developmentName}`,detail,href:`/admin/gestion/consultas-emprendimientos/${item.id}`,createdAt:item.createdAt.toISOString()};
    }),
    ...recentAiConversations.map(item=>({id:item.id,type:"AI_CONVERSATION" as const,title:"Conversación IA para contactar",detail:item.name ?? item.phone ?? "Sin nombre",href:`/admin/conversaciones/${item.id}`,createdAt:item.lastMessageAt.toISOString()})),
  ].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,5);

  return (
    <AdminThemeRoot fontFamily={montserrat.style.fontFamily} variant="store" defaultTheme="light">
      <PwaProvider>
        <ConfirmProvider>
          <PromptProvider>
            <aside className="hidden bg-sidebar h-full overflow-y-auto w-64 shrink-0 border-r border-sidebar-border print:hidden lg:flex lg:flex-col">
              <AdminSidebar
                newInquiryCount={newInquiryCount}
                newDevelopmentInquiryCount={newDevelopmentInquiryCount}
                newAiConversationCount={newAiConversationCount}
                priceDropCount={priceDropCount}
                newQrVisitCount={newQrVisitCount}
                agentPermissions={session.user.role === "AGENT" ? permissions : undefined}
              />
            </aside>
            <div className="flex min-w-0 min-h-0 flex-1 flex-col h-full overflow-hidden">
              <AdminTopbar
                newInquiryCount={newInquiryCount}
                newDevelopmentInquiryCount={newDevelopmentInquiryCount}
                newAiConversationCount={newAiConversationCount}
                priceDropCount={priceDropCount}
                newQrVisitCount={newQrVisitCount}
                notificationCount={newInquiryCount + newDevelopmentInquiryCount + newAiConversationCount + priceDropCount + newQrVisitCount}
                notifications={notifications}
              />
              <main className="flex-1 min-h-0 overflow-y-auto px-4 py-6 lg:px-8 print:p-0">{children}</main>
            </div>
          </PromptProvider>
        </ConfirmProvider>
      </PwaProvider>
    </AdminThemeRoot>
  );
}
