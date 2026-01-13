import { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      if (isOnAdmin) {
        if (isLoggedIn) {
          // Check for ADMIN role
          return auth.user.role === "ADMIN";
        }
        return false; // Redirect unauthenticated users to login
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id ?? "";
      }
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        // For database strategy, user object is available
        if (user) {
          session.user.role = (user as { role: string }).role;
          session.user.id = user.id;
        } else if (token) {
          // For JWT strategy
          session.user.role = token.role as string;
          session.user.id = token.id as string;
        }
      }
      return session;
    },
  },
};
