"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface SiteConfig {
  siteName: string;
  siteTagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  footerDescription: string;
  copyright: string;
  socialLinks: Record<string, string> | null;
  contactEmail: string | null;
  contactPhone: string | null;
}

const DEFAULT_CONFIG: SiteConfig = {
  siteName: "Recipe Zen",
  siteTagline: "治愈系美食研习所",
  logoUrl: null,
  faviconUrl: null,
  footerDescription: "用心烹饪每一餐",
  copyright: "Recipe Zen",
  socialLinks: null,
  contactEmail: null,
  contactPhone: null,
};

const SiteConfigContext = createContext<SiteConfig>(DEFAULT_CONFIG);

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

interface SiteConfigProviderProps {
  children: React.ReactNode;
  initialConfig?: SiteConfig;
}

export function SiteConfigProvider({
  children,
  initialConfig,
}: SiteConfigProviderProps) {
  const locale = useLocale();
  const [config, setConfig] = useState<SiteConfig>(
    initialConfig || DEFAULT_CONFIG
  );

  useEffect(() => {
    // 客户端获取配置（带语言参数）
    async function fetchConfig() {
      try {
        const res = await fetch(`/api/config/site?locale=${locale}`);
        const data = await res.json();
        if (data.success && data.data) {
          setConfig(data.data);
        }
      } catch (error) {
        console.error("加载网站配置失败:", error);
      }
    }

    fetchConfig();
  }, [locale]);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}
