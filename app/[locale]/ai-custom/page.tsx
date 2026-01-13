import { redirect } from "next/navigation";
import { localizePath } from "@/lib/i18n/utils";
import type { Locale } from "@/lib/i18n/config";

interface AiCustomRedirectProps {
  params: Promise<{ locale: Locale }>;
}

export default async function AiCustomRedirect({ params }: AiCustomRedirectProps) {
  const { locale } = await params;
  redirect(localizePath("/custom-recipes", locale));
}
