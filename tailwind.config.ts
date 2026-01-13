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
        // 主色调（版本3统一设计语言）
        cream: "#F5F1E8",        // 奶油白（主背景）
        brownWarm: "#C6996B",    // 温暖棕色（主CTA按钮）- 版本3主色
        brownDark: "#5C4A37",    // 深棕色（次要按钮、深色背景）
        primary: "#C6996B",      // 主色别名

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
        'sm': '8px',            // 小圆角
        'md': '12px',           // 中圆角
        'lg': '16px',           // 大圆角（版本3卡片标准）
        'xl': '20px',           // 特大圆角
        '2xl': '24px',          // 超大圆角
        'full': '9999px',       // 全圆角
        'card': '16px',         // 卡片圆角（版本3标准）
        'button': '28px',       // 按钮圆角（版本3全圆角）
        'image': '16px',        // 图片圆角
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0, 0, 0, 0.08)',   // 版本3轻盈卡片阴影
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.12)', // 悬停阴影
        'hover': '0 4px 20px rgba(0, 0, 0, 0.12)',  // 通用悬停阴影
        'subtle': '0 2px 8px rgba(0, 0, 0, 0.06)',  // 极轻阴影
      },
      // 版本3 统一间距
      spacing: {
        'card-padding': '40px',  // 卡片内边距（版本3透气感）
        'section': '80px',       // 模块间距
        'section-lg': '120px',   // 大模块间距
      },
    },
  },
  plugins: [],
};

export default config;
