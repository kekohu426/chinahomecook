"use client";

import { useState } from "react";
import { Share2, Copy, Twitter, Check, Link2 } from "lucide-react";
import { useLocale } from "@/components/i18n/LocaleProvider";

interface ShareButtonProps {
  title: string;
}

export function ShareButton({ title }: ShareButtonProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const getUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  const handleNativeShare = async () => {
    const url = getUrl();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      setShowOptions(!showOptions);
    }
  };

  const handleCopyLink = async () => {
    const url = getUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowOptions(false);
  };

  const handleTwitterShare = () => {
    const url = getUrl();
    const text = encodeURIComponent(title);
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowOptions(false);
  };

  const handleWeiboShare = () => {
    const url = getUrl();
    const text = encodeURIComponent(title);
    const shareUrl = `https://service.weibo.com/share/share.php?title=${text}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowOptions(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* 复制链接按钮 */}
        <button
          onClick={handleCopyLink}
          className="p-2 rounded-full bg-lightGray hover:bg-brownWarm/10 transition-colors"
          title={isEn ? "Copy link" : "复制链接"}
        >
          {copied ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <Link2 className="w-5 h-5 text-textGray" />
          )}
        </button>

        {/* Twitter/X 分享 */}
        <button
          onClick={handleTwitterShare}
          className="p-2 rounded-full bg-lightGray hover:bg-brownWarm/10 transition-colors"
          title={isEn ? "Share to X" : "分享到 Twitter"}
        >
          <Twitter className="w-5 h-5 text-textGray" />
        </button>

        {/* 微博分享 */}
        <button
          onClick={handleWeiboShare}
          className="p-2 rounded-full bg-lightGray hover:bg-brownWarm/10 transition-colors"
          title={isEn ? "Share to Weibo" : "分享到微博"}
        >
          <svg
            className="w-5 h-5 text-textGray"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zm-2.248-3.55c-.391.758-.12 1.557.524 1.789.64.232 1.434-.053 1.772-.673.339-.618.152-1.418-.422-1.719-.577-.3-1.484-.015-1.874.603zm1.904-1.803c-.142.254-.05.547.203.654.257.107.575.02.709-.2.134-.22.062-.524-.178-.659-.238-.135-.591-.049-.734.205zm2.247-3.15c-1.971-.506-4.211.416-5.106 2.074-.916 1.694-.152 3.566 1.775 4.178 2.009.634 4.436-.354 5.32-2.127.87-1.738-.018-3.592-1.989-4.125z" />
            <path d="M17.737 12.625c-.261-.092-.439-.156-.302-.562.301-.881.332-1.641.006-2.181-.605-.998-2.256-1.147-4.164-1.023 0 0-.597.061-.444-.477.288-.991.246-1.824-.206-2.303-.992-1.054-3.622.024-5.871 2.419-1.681 1.79-2.656 3.688-2.656 5.352 0 3.187 4.099 5.132 8.104 5.132 5.25 0 8.746-3.048 8.746-5.47 0-1.465-1.232-2.296-3.213-2.887zm2.196-5.503c1.298 1.459 1.578 3.393.769 5.052-.062.127-.028.279.085.357.115.077.271.049.355-.064 1.058-1.371 1.001-3.327-.139-5.127-1.159-1.83-3.135-2.738-5.19-2.478-.167.02-.291.166-.278.329.013.165.14.291.305.291 1.765.01 3.345.909 4.093 1.64z" />
            <path d="M16.139 8.682c.647.727.789 1.694.383 2.524-.031.063-.014.14.042.178.058.039.135.024.178-.034.527-.684.513-1.664-.069-2.559-.591-.911-1.567-1.367-2.594-1.236-.083.01-.145.083-.14.165.005.082.07.145.152.146.88.005 1.667.455 2.048 1.016z" />
          </svg>
        </button>

        {/* 原生分享（移动端） */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleNativeShare}
            className="p-2 rounded-full bg-lightGray hover:bg-brownWarm/10 transition-colors"
            title={isEn ? "More share options" : "更多分享"}
          >
            <Share2 className="w-5 h-5 text-textGray" />
          </button>
        )}
      </div>

      {/* 复制成功提示 */}
      {copied && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-textDark text-white text-xs px-3 py-1 rounded whitespace-nowrap">
          {isEn ? "Link copied" : "链接已复制"}
        </div>
      )}
    </div>
  );
}
