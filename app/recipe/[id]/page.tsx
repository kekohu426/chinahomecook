import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import { localizePath, normalizeLocale } from "@/lib/i18n/utils";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  redirect(localizePath(`/recipe/${id}`, locale));
}
