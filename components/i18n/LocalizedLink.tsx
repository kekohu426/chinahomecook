"use client";

import Link, { type LinkProps } from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getLocaleFromPathname, localizePath } from "@/lib/i18n/utils";

type LocalizedLinkProps = LinkProps & {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export function LocalizedLink({
  href,
  children,
  ...props
}: LocalizedLinkProps) {
  const locale = useLocale();

  const isExternal = href.startsWith("http://") || href.startsWith("https://");
  const hasLocale = getLocaleFromPathname(href);
  const localizedHref = isExternal || hasLocale ? href : localizePath(href, locale);

  return (
    <Link href={localizedHref} {...props}>
      {children}
    </Link>
  );
}
