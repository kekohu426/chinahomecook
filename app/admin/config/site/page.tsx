"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Loader2,
  Save,
  Globe,
  Mail,
  Phone,
  FileText,
  Link2,
} from "lucide-react";
import { DEFAULT_LOCALE, LOCALE_LABELS, type Locale } from "@/lib/i18n/config";

interface SiteConfig {
  id: string;
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
  id: "default",
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

export default function SiteConfigPage() {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);

  // 社交媒体链接表单
  const [socialLinksForm, setSocialLinksForm] = useState({
    weibo: "",
    wechat: "",
    xiaohongshu: "",
    instagram: "",
    twitter: "",
    youtube: "",
  });

  useEffect(() => {
    loadConfig();
  }, [locale]);

  async function loadConfig() {
    setLoading(true);
    try {
      const res = await fetch(`/api/config/site?locale=${locale}`);
      const data = await res.json();

      if (data.success && data.data) {
        setConfig(data.data);
        if (data.data.socialLinks) {
          setSocialLinksForm({
            weibo: data.data.socialLinks.weibo || "",
            wechat: data.data.socialLinks.wechat || "",
            xiaohongshu: data.data.socialLinks.xiaohongshu || "",
            instagram: data.data.socialLinks.instagram || "",
            twitter: data.data.socialLinks.twitter || "",
            youtube: data.data.socialLinks.youtube || "",
          });
        }
      }
    } catch (error) {
      console.error("加载配置失败:", error);
      alert("加载配置失败");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    setSaving(true);
    try {
      // 构建社交链接对象（过滤空值）
      const socialLinks = Object.fromEntries(
        Object.entries(socialLinksForm).filter(([, v]) => v.trim())
      );

      const body = {
        ...config,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        locale,
      };

      const res = await fetch("/api/config/site", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("保存失败");
      alert("保存成功");
      loadConfig();
    } catch (error) {
      console.error("保存失败:", error);
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brownWarm" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 头部 */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-serif font-medium text-textDark mb-2">
            网站配置
          </h1>
          <p className="text-textGray">
            管理网站名称、Logo、Footer 等全局信息
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-textGray">当前语言：</span>
          {Object.entries(LOCALE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLocale(key as Locale)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                locale === key
                  ? "bg-brownWarm text-white"
                  : "bg-cream text-textGray hover:text-textDark"
              }`}
            >
              {label}
            </button>
          ))}
          {locale !== DEFAULT_LOCALE && (
            <span className="text-xs text-textGray">
              当前为翻译内容编辑（仅支持文字类字段）
            </span>
          )}
        </div>
      </div>

      {/* 品牌信息 */}
      <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-medium text-textDark">
          <Globe className="w-5 h-5" />
          品牌信息
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              网站名称
            </label>
            <input
              value={config.siteName}
              onChange={(e) =>
                setConfig({ ...config, siteName: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="Recipe Zen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              网站标语
            </label>
            <input
              value={config.siteTagline}
              onChange={(e) =>
                setConfig({ ...config, siteTagline: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="治愈系美食研习所"
            />
          </div>
        </div>

        {locale === DEFAULT_LOCALE && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Logo URL
              </label>
              <input
                value={config.logoUrl || ""}
                onChange={(e) =>
                  setConfig({ ...config, logoUrl: e.target.value || null })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="https://..."
              />
              {config.logoUrl && (
                <div className="mt-2 inline-block">
                  <Image
                    src={config.logoUrl}
                    alt="Logo 预览"
                    width={120}
                    height={40}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Favicon URL
              </label>
              <input
                value={config.faviconUrl || ""}
                onChange={(e) =>
                  setConfig({ ...config, faviconUrl: e.target.value || null })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="https://..."
              />
              {config.faviconUrl && (
                <div className="mt-2 inline-block">
                  <Image
                    src={config.faviconUrl}
                    alt="Favicon 预览"
                    width={32}
                    height={32}
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer 信息 */}
      <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-medium text-textDark">
          <FileText className="w-5 h-5" />
          Footer 信息
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-textDark mb-2">
              Footer 描述
            </label>
            <input
              value={config.footerDescription}
              onChange={(e) =>
                setConfig({ ...config, footerDescription: e.target.value })
              }
              className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
              placeholder="用心烹饪每一餐"
            />
          </div>

          {locale === DEFAULT_LOCALE && (
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                版权信息
              </label>
              <input
                value={config.copyright}
                onChange={(e) =>
                  setConfig({ ...config, copyright: e.target.value })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="Recipe Zen"
              />
            </div>
          )}
        </div>
      </div>

      {/* 联系信息（仅默认语言） */}
      {locale === DEFAULT_LOCALE && (
        <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
          <div className="flex items-center gap-2 text-lg font-medium text-textDark">
            <Mail className="w-5 h-5" />
            联系信息
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                联系邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textGray" />
                <input
                  value={config.contactEmail || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contactEmail: e.target.value || null,
                    })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="hello@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                联系电话
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textGray" />
                <input
                  value={config.contactPhone || ""}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      contactPhone: e.target.value || null,
                    })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                  placeholder="+86 xxx xxxx xxxx"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 社交媒体链接（仅默认语言） */}
      {locale === DEFAULT_LOCALE && (
        <div className="bg-white rounded-lg border border-lightGray p-6 space-y-6">
          <div className="flex items-center gap-2 text-lg font-medium text-textDark">
            <Link2 className="w-5 h-5" />
            社交媒体链接
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                微博
              </label>
              <input
                value={socialLinksForm.weibo}
                onChange={(e) =>
                  setSocialLinksForm({
                    ...socialLinksForm,
                    weibo: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="https://weibo.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                微信公众号
              </label>
              <input
                value={socialLinksForm.wechat}
                onChange={(e) =>
                  setSocialLinksForm({
                    ...socialLinksForm,
                    wechat: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="公众号 ID 或链接"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                小红书
              </label>
              <input
                value={socialLinksForm.xiaohongshu}
                onChange={(e) =>
                  setSocialLinksForm({
                    ...socialLinksForm,
                    xiaohongshu: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="https://xiaohongshu.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Instagram
              </label>
              <input
                value={socialLinksForm.instagram}
                onChange={(e) =>
                  setSocialLinksForm({
                    ...socialLinksForm,
                    instagram: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="https://instagram.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Twitter / X
              </label>
              <input
                value={socialLinksForm.twitter}
                onChange={(e) =>
                  setSocialLinksForm({
                    ...socialLinksForm,
                    twitter: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                YouTube
              </label>
              <input
                value={socialLinksForm.youtube}
                onChange={(e) =>
                  setSocialLinksForm({
                    ...socialLinksForm,
                    youtube: e.target.value,
                  })
                }
                className="w-full px-4 py-2 border border-lightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-brownWarm/50"
                placeholder="https://youtube.com/..."
              />
            </div>
          </div>
        </div>
      )}

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-8 py-3 bg-brownWarm text-white rounded-lg hover:bg-brownDark transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          保存配置
        </button>
      </div>
    </div>
  );
}
