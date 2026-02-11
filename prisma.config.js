/**
 * Prisma 7 config (JS)
 * Datasource URL from DIRECT_URL or DATABASE_URL.
 */

// 手动加载 .env 文件
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

module.exports = {
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
};
