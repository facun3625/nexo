import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import authConfig from "@/auth.config";
import { tenantAwareAdapter } from "@/lib/auth-adapter";
import { getCurrentTenant } from "@/lib/tenant";
import {
  LOGIN_IP_RULE,
  LOGIN_RULE,
  clearFailures,
  clientIp,
  isRateLimited,
  recordFailure,
} from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth(async (req) => {
  const tenant = await getCurrentTenant();
  const tenantId = tenant?.id ?? "";

  return {
    ...authConfig,
    adapter: tenantAwareAdapter(tenantId),
    trustHost: true,
    session: { strategy: "jwt" },
    providers: [
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Contraseña", type: "password" },
        },
        authorize: async (credentials) => {
          const email = credentials?.email as string | undefined;
          const password = credentials?.password as string | undefined;
          if (!email || !password) return null;

          // Freno de fuerza bruta.
          const accountKey = `login:${email.toLowerCase()}`;
          const ipKey = `login-ip:${clientIp(req?.headers ?? new Headers())}`;
          const [accountBlocked, ipBlocked] = await Promise.all([
            isRateLimited(accountKey, LOGIN_RULE),
            isRateLimited(ipKey, LOGIN_IP_RULE),
          ]);
          // Se devuelve null (igual que una contraseña incorrecta) en vez de
          // un error propio: decir "estás bloqueado" le confirmaría al
          // atacante que la cuenta existe y que va por buen camino.
          if (accountBlocked || ipBlocked) return null;

          const user = await prisma.user.findUnique({
            where: { tenantId_email: { tenantId, email } },
          });
          if (
            user?.role === "AGENT" &&
            !(await prisma.estateAgent.findFirst({ where: { userId: user.id, tenantId, accessEnabled: true } }))
          ) {
            return null;
          }
          if (!user?.passwordHash) {
            await Promise.all([recordFailure(accountKey), recordFailure(ipKey)]);
            return null;
          }

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) {
            await Promise.all([recordFailure(accountKey), recordFailure(ipKey)]);
            return null;
          }

          // Entró bien: se borra el historial para que los errores previos
          // no se le acumulen a alguien que simplemente se equivocó al tipear.
          await clearFailures(accountKey);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            tenantId: user.tenantId,
          };
        },
      }),
    ],
  };
});
