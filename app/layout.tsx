import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipe Zen - 食谱研习",
  description: "极致治愈 × 极致实用的中国美食指南",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-cream">
        {children}
      </body>
    </html>
  );
}
