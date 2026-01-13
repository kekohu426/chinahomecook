import { auth } from "@/lib/auth/edge";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  type Locale,
} from "@/lib/i18n/config";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n/utils";
import { NextResponse } from "next/server";

/**
 * 从 Accept-Language 头解析首选语言
 *
 * 示例输入: "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
 * 返回第一个匹配 SUPPORTED_LOCALES 的语言，或 undefined
 */
function getPreferredLocale(acceptLanguage: string | null): Locale | undefined {
  if (!acceptLanguage) return undefined;

  // 解析 Accept-Language 头，按权重排序
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, qValue] = lang.trim().split(";q=");
      return {
        code: code.toLowerCase().split("-")[0], // 取主语言代码（zh-CN -> zh）
        q: qValue ? parseFloat(qValue) : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  // 找到第一个支持的语言
  for (const lang of languages) {
    if (SUPPORTED_LOCALES.includes(lang.code as Locale)) {
      return lang.code as Locale;
    }
  }

  return undefined;
}

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === "ADMIN";

  const isApiRoute = pathname.startsWith("/api");
  const isAdminRoute = pathname.startsWith("/admin");
  const isInternalAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap");
  const isPublicFile = /\.[a-z0-9]+$/i.test(pathname);
  const isAuthPage = pathname === "/login" || pathname === "/unauthorized";

  const localeInPath = getLocaleFromPathname(pathname);

  // 处理缺少 locale 的用户端路由
  if (!isApiRoute && !isAdminRoute && !isInternalAsset && !isPublicFile && !isAuthPage) {
    if (!localeInPath) {
      // 优先级：Cookie > Accept-Language > 默认语言
      const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined;
      const acceptLanguage = req.headers.get("accept-language");
      const browserLocale = getPreferredLocale(acceptLanguage);

      const targetLocale = cookieLocale || browserLocale || DEFAULT_LOCALE;

      const redirectUrl = new URL(
        localizePath(pathname, targetLocale),
        nextUrl
      );
      const response = NextResponse.redirect(redirectUrl);
      response.cookies.set(LOCALE_COOKIE_NAME, targetLocale);
      return response;
    }
  }

  // Protect /admin/* routes
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }
  }

  // Protect sensitive API routes (POST/PUT/DELETE only)
  if (isApiRoute) {
    const method = req.method;
    const isWriteOperation = ["POST", "PUT", "PATCH", "DELETE"].includes(
      method
    );

    // Allow GET requests to pass through (public read access)
    if (!isWriteOperation) {
      return NextResponse.next();
    }

    // List of protected API paths
    const protectedPaths = [
      "/api/admin",
      "/api/recipes",
      "/api/config",
      "/api/upload",
      "/api/ai/generate-recipe",
      "/api/ai/generate-recipes-batch",
      "/api/ai/chef",
      "/api/images/generate",
      "/api/custom-recipes",
      "/api/gallery",
    ];

    const isProtectedPath = protectedPaths.some((path) =>
      nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath) {
      if (!isLoggedIn || !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }
  }

  const response = NextResponse.next();
  if (localeInPath) {
    response.cookies.set(LOCALE_COOKIE_NAME, localeInPath);
  }
  return response;
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};
