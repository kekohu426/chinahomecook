"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizePath } from "@/lib/i18n/utils";

export function HeaderAuth() {
  const { data: session, status } = useSession();
  const locale = useLocale();
  const isEn = locale === "en";

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        {session.user.role === "ADMIN" && (
          <Link
            href="/admin/recipes"
            className="text-sm hover:text-cream/80 transition-colors"
          >
            {isEn ? "Admin" : "后台管理"}
          </Link>
        )}
        <div className="relative group">
          <button className="flex items-center gap-2">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || (isEn ? "User" : "用户")}
                width={32}
                height={32}
                className="rounded-full border-2 border-white/30"
                unoptimized
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-sm font-medium">
                {session.user.name?.charAt(0) || "U"}
              </div>
            )}
          </button>
          {/* 下拉菜单 */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {session.user.email}
              </p>
            </div>
            {session.user.role === "ADMIN" && (
              <Link
                href="/admin/recipes"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                {isEn ? "Admin" : "后台管理"}
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: localizePath("/", locale) })}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              {isEn ? "Sign out" : "退出登录"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {isEn ? "Sign in" : "登录"}
    </button>
  );
}
