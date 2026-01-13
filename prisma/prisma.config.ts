/**
 * Prisma 7 配置文件
 */

export default {
  datasource: {
    db: {
      // Prisma 7: datasource URL moved这里。优先 DIRECT_URL，其次 DATABASE_URL。
      url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
    },
  },
};
