import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StoreHero } from "@/components/catalog/store-hero";
import { StoreFooter } from "@/components/catalog/store-footer";
import { ProfileForm } from "./profile-form";
import { CustomerSidebar } from "@/components/customer-sidebar";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/perfil");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
  });

  return (
    <div className="public-inner-page public-account-page flex flex-1 flex-col">
      <StoreHero />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 bg-background px-4 py-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-12">
          <CustomerSidebar />
          <div className="flex flex-col gap-6">
            <h1 className="text-xl font-semibold">Mi perfil</h1>
            <ProfileForm
              user={{
                name: user.name ?? "",
                email: user.email,
                phone: user.phone ?? "",
                address: user.address ?? "",
                image: user.image,
              }}
            />
          </div>
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
