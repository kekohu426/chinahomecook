"use client";

import { signOut } from "next-auth/react";
import Image from "next/image";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { localizePath } from "@/lib/i18n/utils";
import { useTranslations } from "@/lib/i18n/translations";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const locale = useLocale();
  const { t } = useTranslations();
  return (
    <div className="flex items-center gap-3">
      {user.image && (
        <Image
          src={user.image}
          alt={user.name || t("auth.user")}
          width={32}
          height={32}
          className="rounded-full"
          unoptimized
        />
      )}
      <div className="text-sm flex-1 min-w-0">
        <p className="font-medium text-white truncate">{user.name}</p>
        <p className="text-cream/70 text-xs truncate">{user.email}</p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: localizePath("/", locale) })}
        className="px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors whitespace-nowrap"
      >
        {t("auth.signOut")}
      </button>
    </div>
  );
}
