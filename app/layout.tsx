import { cookies } from "next/headers";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import "./globals.css";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const isEn = localeCookie === "en";
  return {
    title: isEn ? "Recipe Zen - Food Companion" : "Recipe Zen - 食谱研习",
    description: isEn
      ? "A warm, reliable Chinese food companion with expert-reviewed recipes."
      : "极致治愈 × 极致实用的中国美食指南",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const htmlLang = localeCookie || DEFAULT_LOCALE;

  return (
    <html lang={htmlLang}>
      <body className="font-sans antialiased bg-cream">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
