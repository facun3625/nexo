import prisma from "./prisma";

export async function getSiteConfig() {
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
          whatsapp: "5493424565000",
          phone: "+54 342 456-5000",
          email: "administracion@penalvainmobiliaria.com.ar",
          address: "Eva Perón 2845 — Santa Fe, Argentina",
        },
      });
    }

    return config;
  } catch (error) {
    console.error("Failed to fetch site config:", error);
    return {
      facebook: "",
      instagram: "",
      whatsapp: "5493424565000",
      phone: "+54 342 456-5000",
      email: "administracion@penalvainmobiliaria.com.ar",
      address: "Eva Perón 2845 — Santa Fe, Argentina",
    };
  }
}
