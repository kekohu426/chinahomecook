import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import { authConfig } from "./config";

// 管理员邮箱列表
const ADMIN_EMAILS = [
  "hukeko0206@gmail.com",
];

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
        // 根据邮箱判断角色
        const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "");
        token.role = isAdmin ? "ADMIN" : "USER";
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
