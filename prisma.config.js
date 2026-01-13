/**
 * Prisma 7 config (JS)
 * Datasource URL from DIRECT_URL or DATABASE_URL.
 */

module.exports = {
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
};
