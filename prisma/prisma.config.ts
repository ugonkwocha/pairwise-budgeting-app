// Prisma 7.x configuration
// For prisma db push to work, datasourceUrl must be available from the environment
const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export default {
  datasourceUrl,
};
