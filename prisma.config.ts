// Load .env.local manually since Prisma CLI doesn't auto-load it
require('dotenv').config({ path: '.env.local' });

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
