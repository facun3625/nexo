import type { NextAuthConfig, DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      tenantId: string | null;
      // Id del super admin que abrió esta sesión con "Entrar como admin"
      // (ver /platform/tiendas/[tenantId]/actions.ts) — undefined en una
      // sesión normal. Solo lo usa el cartel de "modo soporte" del panel.
      impersonatedBy?: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    tenantId?: string | null;
    impersonatedBy?: string;
  }
}

// Nombre propio para la cookie de sesión: con el default
// ("authjs.session-token") cualquier otra app Auth.js corriendo en
// localhost (las cookies no distinguen puerto) pisa o comparte la cookie,
// y como está cifrada con otro AUTH_SECRET falla con JWTSessionError
// "no matching decryption secret".
const secureCookies = process.env.NODE_ENV === "production";
export const SESSION_COOKIE_NAME = `${secureCookies ? "__Secure-" : ""}nexo.session-token`;

// Config compartida entre el runtime completo (auth.ts) y el middleware,
// que corre en Edge y no puede cargar Prisma/bcrypt.
export default {
  providers: [],
  trustHost: true,
  cookies: {
    sessionToken: {
      name: SESSION_COOKIE_NAME,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: secureCookies,
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      if (user) {
        token.role = (user as { role?: Role }).role ?? "CUSTOMER";
        token.tenantId = (user as { tenantId?: string | null }).tenantId ?? null;
        token.impersonatedBy = (user as { impersonatedBy?: string }).impersonatedBy;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role ?? "CUSTOMER";
        session.user.tenantId = token.tenantId ?? null;
        session.user.impersonatedBy = token.impersonatedBy;
        if (token.picture) session.user.image = token.picture;
        if (token.name) session.user.name = token.name;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
