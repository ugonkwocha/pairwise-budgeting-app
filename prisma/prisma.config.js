// Prisma 7.x configuration (JavaScript for direct execution)
// Provide datasource URL to prisma db push when not in schema.prisma

const datasourceUrl = process.env.DATABASE_URL;

console.log('[Prisma Config] DATABASE_URL is', datasourceUrl ? 'SET' : 'UNDEFINED');
if (datasourceUrl) {
  console.log('[Prisma Config] URL starts with:', datasourceUrl.substring(0, 20) + '...');
}

module.exports = {
  datasource: {
    url: datasourceUrl,
  },
};
