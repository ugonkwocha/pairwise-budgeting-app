FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache git

# Clone repository
RUN git clone https://github.com/ugonkwocha/pairwise-budgeting-app.git . && \
    git log -1 --oneline

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Start the application
CMD ["npm", "start"]
