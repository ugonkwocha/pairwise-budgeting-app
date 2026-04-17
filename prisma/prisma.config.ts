// Prisma 7.x configuration
// Provide datasource URL to prisma db push when not in schema.prisma
const datasourceUrl = process.env.DATABASE_URL;

console.log('[Prisma Config] DATABASE_URL is', datasourceUrl ? 'SET' : 'UNDEFINED');
console.log('[Prisma Config] Env keys:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('URL')).join(', '));

export default {
  datasource: {
    url: datasourceUrl,
  },
};
