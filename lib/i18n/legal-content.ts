import fs from "fs";
import path from "path";
import MarkdownIt from "markdown-it";
import type { Locale } from "@/lib/i18n/config";

type LegalSlug = "terms" | "privacy" | "copyright";

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
});

const LEGAL_DIR = path.join(process.cwd(), "content", "legal");

const buildLocaleFallbacks = (locale: Locale): Locale[] => {
  const fallbacks: Locale[] = [];
  if (locale) fallbacks.push(locale);
  if (locale !== "en") fallbacks.push("en");
  if (locale !== "zh") fallbacks.push("zh");
  return fallbacks;
};

const interpolate = (raw: string, params?: Record<string, string>) => {
  if (!params) return raw;
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replaceAll(`{{${key}}}`, value),
    raw
  );
};

export function renderLegalMarkdown(
  slug: LegalSlug,
  locale: Locale,
  params?: Record<string, string>
): string {
  const candidates = buildLocaleFallbacks(locale);
  for (const candidate of candidates) {
    const filePath = path.join(LEGAL_DIR, `${slug}.${candidate}.md`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    const rendered = md.render(interpolate(content, params));
    return rendered;
  }
  return "";
}

