import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/utils";

export default async function UnauthorizedPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale | undefined;
  const locale = cookieLocale || DEFAULT_LOCALE;
  const isEn = locale === "en";
  const homeHref = localizePath("/", locale);
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center px-4">
        <h1 className="text-6xl font-serif font-medium text-brownDark mb-4">
          403
        </h1>
        <h2 className="text-xl text-brownDark mb-2">
          {isEn ? "Access denied" : "访问受限"}
        </h2>
        <p className="text-textGray mb-8 max-w-md mx-auto">
          {isEn
            ? "Sorry, you do not have permission to access this page. Please contact the site administrator if you need admin access."
            : "抱歉，您没有权限访问此页面。如需管理员权限，请联系网站管理员。"}
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href={homeHref}
            className="px-6 py-2.5 bg-brownWarm text-white rounded-xl hover:bg-brownDark transition-colors"
          >
            {isEn ? "Back to Home" : "返回首页"}
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 border-2 border-brownWarm text-brownWarm rounded-xl hover:bg-brownWarm/5 transition-colors"
          >
            {isEn ? "Sign in again" : "重新登录"}
          </Link>
        </div>
      </div>
    </div>
  );
}
