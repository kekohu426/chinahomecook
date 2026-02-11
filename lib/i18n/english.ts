export const CJK_CHARS = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g;
export const CJK_TEST = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;

export function containsCjk(value?: string | null): boolean {
  if (!value) return false;
  return CJK_TEST.test(value);
}

export function stripCjk(value: string): string {
  return value.replace(CJK_CHARS, "");
}

export function ensureEnglish(value?: string | null, fallback = ""): string {
  if (!value) return fallback;
  const cleaned = stripCjk(value).replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

export function titleFromSlug(slug?: string | null, fallback = ""): string {
  if (!slug) return fallback;
  const cleaned = slug
    .replace(/[\/_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  return cleaned
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function toEnglishLabel(
  value: string | null | undefined,
  map: Record<string, string> | undefined,
  fallback = ""
): string {
  if (!value) return fallback;
  if (map && map[value]) return map[value];
  const cleaned = ensureEnglish(value, "");
  return cleaned || fallback;
}
