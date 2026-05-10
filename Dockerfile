FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

# Clone repository
RUN git clone https://github.com/ugonkwocha/pairwise-budgeting-app.git . && \
    git log -1 --oneline

# Install dependencies
RUN npm install

# Build Next.js application
RUN npm run build

# Remove dev dependencies for production
RUN npm prune --omit=dev

# Expose Next.js port
EXPOSE 3000

# Start Next.js app. Run Supabase SQL migrations separately with npm run migrate.
CMD ["npm", "start"]
