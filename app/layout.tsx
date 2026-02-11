import { cookies } from "next/headers";
import { Bodoni_Moda, Source_Sans_3 } from "next/font/google";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import "./globals.css";
import type { Metadata } from "next";

const displayFont = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

const sansFont = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang={htmlLang} data-scroll-behavior="smooth">
      <body className={`${sansFont.variable} ${displayFont.variable} font-sans antialiased bg-cream`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
