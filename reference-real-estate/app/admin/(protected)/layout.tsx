import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/?login=1");

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f4f5]">
      <div className="h-screen overflow-y-auto shrink-0">
        <AdminSidebar />
      </div>
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
