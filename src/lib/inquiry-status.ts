import type { ServiceInquiryStatus } from "@/generated/prisma/client";

export const INQUIRY_STATUS_LABELS: Record<ServiceInquiryStatus, string> = {
  NEW: "Nueva", IN_PROGRESS: "En seguimiento", QUOTED: "Presupuestada",
  RESPONDED: "Respondida", ACCEPTED: "Aceptada", REJECTED: "Rechazada", CLOSED: "Cerrada",
};
export const INQUIRY_STATUS_COLORS: Record<ServiceInquiryStatus, string> = {
  NEW: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  QUOTED: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  RESPONDED: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  ACCEPTED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400",
  CLOSED: "bg-muted text-muted-foreground",
};
