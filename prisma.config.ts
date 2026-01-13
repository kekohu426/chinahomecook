/**
 * Prisma 7 config
 * Datasource URL comes from DIRECT_URL or DATABASE_URL env.
 */

module.exports = {
  datasource: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
    },
  },
};
