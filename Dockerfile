FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

# Clone repository
RUN git clone https://github.com/ugonkwocha/pairwise-budgeting-app.git . && \
    git log -1 --oneline

# Install all dependencies (for build and Prisma)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Remove dev dependencies for production (keep prisma CLI)
RUN npm prune --omit=dev

# Expose Next.js port
EXPOSE 3000

# Start: push schema to database, then start Next.js app
# DATABASE_URL environment variable must be set in Coolify
CMD ["npm", "run", "start:with-db-push"]
