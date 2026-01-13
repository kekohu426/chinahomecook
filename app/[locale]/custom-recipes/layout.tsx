import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "AI Custom Recipes - Recipe Zen" : "AI 定制食谱 - Recipe Zen",
    description: isEn
      ? "Create personalized recipes with expert review, ready in minutes."
      : "输入需求即可生成专属食谱，专业审核更安心。",
  };
}

export default function CustomRecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
