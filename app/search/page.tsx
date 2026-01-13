import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import { localizePath, normalizeLocale } from "@/lib/i18n/utils";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ? `?q=${encodeURIComponent(params.q)}` : "";
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);
  redirect(`${localizePath("/search", locale)}${query}`);
}
