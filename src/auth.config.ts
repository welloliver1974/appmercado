import type { NextAuthConfig } from "next-auth";
import Passkey from "next-auth/providers/passkey";

export const authConfig = {
  providers: [
    Passkey({
      // Habilita suporte a Passkeys (Biometria)
    }),
  ],
  experimental: {
    enableWebAuthn: true,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute = nextUrl.pathname === "/login";

      if (isAuthRoute) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
} satisfies NextAuthConfig;
