import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主色调（严格遵循设计稿）
        cream: "#F5F1E8",        // 奶油白（主背景）
        brownWarm: "#8B6F47",    // 暖棕色（主要按钮、标签）
        brownDark: "#5C4A37",    // 深棕色（COOK NOW按钮、AI卡片背景）

        // 辅助色
        lightGray: "#F8F8F8",    // 浅灰（卡片背景）
        textGray: "#666666",     // 文字灰
        textDark: "#333333",     // 深色文字
        orangeAccent: "#E8A87C", // 强调橙（状态检查图标）

        // 全屏模式专用
        fullscreenBg: "#1A1A1A", // 黑色背景
        fullscreenText: "#FFFFFF", // 白色文字

        // 可选辅助色（渐变、图标背景等）
        warmWood: "#D4A574",     // 暖木色
        matchaGreen: "#88B04B",  // 抹茶绿
        clayRed: "#C1665A",      // 陶土红
        softGray: "#E8E8E8",     // 浅灰

        // 兼容色阶（用于现有UI）
        sage: {
          50: "#F3F6F1",
          100: "#E2E9DD",
          200: "#C9D6C3",
          300: "#AEC1A4",
          400: "#8FAA84",
          500: "#708E68",
          600: "#566F50",
          700: "#3F523A",
          800: "#2E3D2B",
        },
      },
      fontFamily: {
        serif: ["Noto Serif SC", "Georgia", "serif"],
        sans: ["Inter", "PingFang SC", "sans-serif"],
      },
      fontSize: {
        'title-lg': '48px',     // 大标题（啤酒鸭）
        'title-md': '24px',     // 步骤标题
        'base': '16px',         // 正文
        'sm': '14px',           // 小字
      },
      borderRadius: {
        'sm': '8px',            // 小圆角（按钮）
        'md': '12px',           // 中圆角（卡片）
        'lg': '16px',           // 大圆角（步骤图片）
        'card': '12px',         // 卡片圆角（别名）
        'button': '8px',        // 按钮圆角（别名）
        'image': '16px',        // 图片圆角（别名）
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',   // 卡片阴影
        'hover': '0 4px 20px rgba(0, 0, 0, 0.12)',  // 悬停阴影
      },
    },
  },
  plugins: [],
};

export default config;
