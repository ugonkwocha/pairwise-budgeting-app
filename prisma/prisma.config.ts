// Prisma 7.x configuration - handle both client and migrate scenarios
export default {
  datasourceUrl: process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL,
};
