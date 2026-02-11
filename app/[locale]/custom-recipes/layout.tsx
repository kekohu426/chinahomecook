import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { t } from "@/lib/i18n/translations";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: t("customRecipes.metaTitle", locale),
    description: t("customRecipes.metaDescription", locale),
  };
}

export default function CustomRecipesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
