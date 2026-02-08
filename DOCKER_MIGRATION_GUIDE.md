# Docker Migration Guide

Complete guide for using Docker to run Prisma database migrations on Coolify.

## Overview

The `Dockerfile.prisma-migrate` automates the entire migration process:
1. Clones the repo from GitHub
2. Installs dependencies
3. Generates Prisma client
4. Runs all migrations
5. Creates database schema

No manual SQL commands needed!

---

## Quick Start

### Build the Migration Image

```bash
docker build -f Dockerfile.prisma-migrate -t pairwise-migrate .
```

### Run Migration

```bash
docker run \
  -e DATABASE_URL="postgresql://postgres:doQQOu7ZAzprjMD6rN9rTce7K7UBNoKs@157.180.36.81:5432/postgres" \
  pairwise-migrate
```

### For Coolify Internal Network

```bash
docker run \
  --network coolify \
  -e DATABASE_URL="postgresql://postgres:doQQOu7ZAzprjMD6rN9rTce7K7UBNoKs@budgeting-app-db:5432/postgres" \
  pairwise-migrate
```

---

## Environment Variables

### Required

**DATABASE_URL** - PostgreSQL connection string

Format: `postgresql://user:password@host:port/database`

Examples:
```bash
# Local development
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres

# Coolify internal network
DATABASE_URL=postgresql://postgres:password@budgeting-app-db:5432/postgres

# Coolify external (if port exposed)
DATABASE_URL=postgresql://postgres:password@157.180.36.81:5432/postgres
```

### Optional

```bash
# Skip generation (already generated)
SKIP_ENV_VALIDATION=true

# Print SQL before executing (for debugging)
# DATABASE_DEBUG=true
```

---

## Usage Scenarios

### Scenario 1: Local Development

Build and test migrations locally:

```bash
# Build image
docker build -f Dockerfile.prisma-migrate -t pairwise-migrate .

# Run with local database
docker run \
  -e DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/postgres" \
  pairwise-migrate
```

### Scenario 2: Coolify Deployment (Internal Network)

Deploy on Coolify with internal service communication:

1. **SSH into Coolify server:**
   ```bash
   ssh root@157.180.36.81
   ```

2. **Clone your repo:**
   ```bash
   cd /opt/coolify/apps
   git clone https://github.com/ugonkwocha/pairwise-budgeting-app.git
   cd pairwise-budgeting-app
   ```

3. **Build and run migration:**
   ```bash
   docker build -f Dockerfile.prisma-migrate -t pairwise-migrate .

   docker run \
     --network coolify \
     -e DATABASE_URL="postgresql://postgres:doQQOu7ZAzprjMD6rN9rTce7K7UBNoKs@budgeting-app-db:5432/postgres" \
     pairwise-migrate
   ```

### Scenario 3: Coolify CI/CD Pipeline

Add to your Coolify deployment as a **pre-deployment hook:**

In Coolify Application settings → **Webhooks** or **Pre-deploy script:**

```bash
#!/bin/bash
docker build -f Dockerfile.prisma-migrate -t migrate:latest .

docker run \
  --network coolify \
  -e DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@budgeting-app-db:5432/postgres" \
  migrate:latest

if [ $? -ne 0 ]; then
  echo "Migration failed!"
  exit 1
fi

echo "Migration successful! Proceeding with app deployment..."
```

### Scenario 4: Scheduled Migrations

Use Docker Compose to run migrations on a schedule:

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  migrate:
    build:
      context: .
      dockerfile: Dockerfile.prisma-migrate
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@db:5432/postgres
    networks:
      - app-network
    restart: "no"

networks:
  app-network:
    driver: bridge
```

Run with:
```bash
docker-compose run migrate
```

---

## What Happens During Migration

### Step 1: Clone Repository
```
git clone https://github.com/ugonkwocha/pairwise-budgeting-app.git
```

### Step 2: Install Dependencies
```
npm install --omit=dev
# Installs only production dependencies (faster)
```

### Step 3: Generate Prisma Client
```
npx prisma generate
# Generates TypeScript types from schema
```

### Step 4: Run Migrations
```
npx prisma migrate deploy
# Executes all pending migrations from prisma/migrations/
```

The first time, this creates all 12 tables:
- users
- households
- household_members
- invites
- income_sources
- categories
- incomes
- monthly_categories
- expenses
- savings_goals
- savings_contributions
- alerts

Subsequent runs only apply new migrations.

---

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** DATABASE_URL hostname is wrong

**Fix:**
```bash
# Check Coolify service name
docker ps | grep postgres

# Use correct hostname
docker run \
  --network coolify \
  -e DATABASE_URL="postgresql://postgres:pwd@[SERVICE_NAME]:5432/postgres" \
  pairwise-migrate
```

### Authentication Failed

```
Error: password authentication failed for user "postgres"
```

**Cause:** Wrong password in DATABASE_URL

**Fix:**
- Verify credentials from Coolify settings
- Check for special characters that need URL encoding

### "No migrations found"

```
No migration files found in migrations directory.
```

**Cause:** First run - no migrations yet

**Fix:**
- This is normal on first run
- Migration files are created locally with `npx prisma migrate dev`
- Commit migrations to git before using Docker image

### Migration Already Applied

```
Migration `20260208_init` has already been applied to the database
```

**Cause:** Migration was already run

**Fix:**
- Normal behavior - migrations are idempotent
- Safe to run multiple times

---

## Development Workflow

### Local Development

```bash
# 1. Make schema changes
# Edit: prisma/schema.prisma

# 2. Create migration
npx prisma migrate dev --name description_of_change

# 3. Test locally
npm run dev

# 4. Commit and push
git add .
git commit -m "Update schema"
git push origin main
```

### Production Deployment

```bash
# 1. Pull latest changes on Coolify
git pull origin main

# 2. Run migration via Docker
docker build -f Dockerfile.prisma-migrate -t migrate .
docker run \
  --network coolify \
  -e DATABASE_URL="postgresql://..." \
  migrate

# 3. Deploy app
docker-compose up -d app
```

---

## Production Considerations

### Security

- ✅ DATABASE_URL should be a secret in Coolify
- ✅ Never commit DATABASE_URL to git
- ✅ Use Coolify's secret management
- ✅ Rotate passwords regularly

### Backups

Before running migrations in production:

```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Test migration on backup first
DATABASE_URL=postgresql://..test.. docker run pairwise-migrate

# If successful, run on production
DATABASE_URL=postgresql://...prod... docker run pairwise-migrate
```

### Rollback

If migration fails:

```bash
# Restore from backup
psql $DATABASE_URL < backup.sql

# Or revert migration in code and redeploy
git revert [commit-hash]
docker run pairwise-migrate
```

---

## Advanced: Custom Migrations

If you need to run custom commands, modify the Dockerfile:

```dockerfile
# After migrations, run custom seed script
RUN npx prisma migrate deploy

# Run seed data
RUN node scripts/seed.js

# Run health check
RUN node scripts/health-check.js
```

---

## Monitoring

### Check Migration Status

```bash
# View migration history
npx prisma migrate status

# View pending migrations
npx prisma migrate status --verbose
```

### Enable Debug Logging

```bash
docker run \
  -e DATABASE_URL="..." \
  -e DEBUG="prisma:*" \
  pairwise-migrate
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Database Migration

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Build migration image
        run: docker build -f Dockerfile.prisma-migrate -t migrate .

      - name: Run migration
        run: |
          docker run \
            -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/test" \
            migrate
```

---

## Support

- [Prisma Migrate Docs](https://www.prisma.io/docs/orm/prisma-migrate)
- [Prisma Deployment Guide](https://www.prisma.io/docs/orm/prisma-migrate/deploy/index)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)
