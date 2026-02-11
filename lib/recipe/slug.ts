const NON_ASCII_REGEX = /[^\x00-\x7F]/;

function sanitizeToken(value: string | number): string {
  const cleaned = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .trim();
  return cleaned || Date.now().toString();
}

export function hasNonAscii(value: string): boolean {
  return NON_ASCII_REGEX.test(value);
}

export function shouldNormalizeCustomSlug(slug: string): boolean {
  if (hasNonAscii(slug)) return true;
  if (!slug.includes("%")) return false;
  try {
    const decoded = decodeURIComponent(slug);
    return decoded !== slug && hasNonAscii(decoded);
  } catch {
    return false;
  }
}

export function toAsciiSlugPart(value?: string | null): string {
  if (!value) return "";

  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 72);
}

export function buildCustomRecipeSlug(options: {
  titleZh?: string | null;
  titleEn?: string | null;
  token?: string | number;
}): string {
  const titleSource = options.titleEn?.trim() || options.titleZh?.trim() || "";
  const slugPart = toAsciiSlugPart(titleSource) || "recipe";
  const token = sanitizeToken(options.token ?? Date.now());
  return `custom-${slugPart}-${token}`;
}
