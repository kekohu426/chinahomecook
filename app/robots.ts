/**
 * 动态 robots.txt 生成
 */

import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://recipesite.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/admin/", "/login", "/unauthorized"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
