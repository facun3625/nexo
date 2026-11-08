import prisma from "@/lib/prisma";
import ConsorciosClient from "./ConsorciosClient";

export const metadata = {
  title: "Administración de Consorcios — Panel",
};

export default async function ConsorciosAdminPage() {
  const consorcios = await prisma.consorcio.findMany({
    orderBy: { order: "asc" },
  });

  return <ConsorciosClient initialData={consorcios} />;
}
