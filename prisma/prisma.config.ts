// Prisma 7.x configuration
// Provide datasource URL to prisma db push when not in schema.prisma
export default {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
