"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/utils";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as Locale) || "zh";
  const isEn = locale === "en";
  const [showLogin, setShowLogin] = useState(false);

  // Timeout fallback - show login form after 3 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (status === "loading") {
        setShowLogin(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [status]);

  // If already logged in, redirect
  useEffect(() => {
    if (session?.user) {
      if (session.user.role === "ADMIN") {
        router.push("/admin/recipes");
      } else {
        router.push(localizePath("/", locale));
      }
    }
  }, [session, router, locale]);

  if (status === "loading" && !showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin w-8 h-8 border-4 border-brownWarm border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Link href={localizePath("/", locale)} className="inline-block">
            <h1 className="text-3xl font-serif font-medium text-brownDark">
              Recipe Zen
            </h1>
            <p className="text-sm text-brownDark/60 mt-1">
              {isEn ? "Healing Food Studio" : "治愈系美食研习所"}
            </p>
          </Link>
        </div>

        <p className="text-center text-textGray mb-8">
          {isEn ? "Sign in to access admin" : "登录以访问管理后台"}
        </p>

        <button
          onClick={() => signIn("google", { callbackUrl: "/admin/recipes" })}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 rounded-xl py-3 px-4 font-medium transition-all"
        >
          <GoogleIcon />
          {isEn ? "Sign in with Google" : "使用 Google 账号登录"}
        </button>

        <p className="text-center text-xs text-textGray/60 mt-6">
          {isEn
            ? "First-time sign-ins will be granted admin access"
            : "首次登录的用户将自动成为管理员"}
        </p>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link
            href={localizePath("/", locale)}
            className="text-sm text-brownWarm hover:underline"
          >
            {isEn ? "Back to Home" : "返回首页"}
          </Link>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
