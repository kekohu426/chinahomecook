import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { authConfig } from "./config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  session: { strategy: "jwt" }, // 使用 JWT，不需要数据库
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // 首次登录时保存用户信息到 token
      if (user) {
        token.id = user.id ?? user.email ?? "";
        token.role = "ADMIN"; // 暂时所有用户都是 ADMIN
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
