# Database Migration Setup Guide

This guide explains how to use Docker to automatically run database migrations on your Supabase instance.

## Overview

The migration system includes:
- **Dockerfile.migration** - Docker image that runs migrations
- **scripts/run-migration.js** - Node.js script that executes the SQL schema
- **supabase/migrations/001_initial_schema.sql** - The database schema

## Quick Start

### Option 1: Manual Docker Build & Run

1. **Build the migration image:**
   ```bash
   docker build -f Dockerfile.migration -t pairwise-migration .
   ```

2. **Run the migration:**
   ```bash
   docker run \
     -e SUPABASE_DB_HOST=your-coolify-server-ip \
     -e SUPABASE_DB_PORT=5432 \
     -e SUPABASE_DB_NAME=pairwise \
     -e SUPABASE_DB_USER=postgres \
     -e SUPABASE_DB_PASSWORD=your_password \
     pairwise-migration
   ```

### Option 2: Using Connection String

If you have a PostgreSQL connection URL from Coolify:

```bash
docker run \
  -e SUPABASE_DB_URL=postgresql://user:password@host:5432/dbname \
  pairwise-migration
```

### Option 3: Using .env File

Create a `.env.migration` file:
```env
SUPABASE_DB_HOST=your-coolify-server-ip
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=pairwise
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_password
NODE_ENV=production
```

Then run:
```bash
docker build -f Dockerfile.migration -t pairwise-migration .
docker run --env-file .env.migration pairwise-migration
```

---

## Integration with Coolify

### Automatic Migrations on Deploy

To run migrations automatically when deploying on Coolify:

1. **Option A: Add to Application Deployment**
   - In Coolify Application settings
   - Add a **pre-deployment hook**:
     ```bash
     docker build -f Dockerfile.migration -t migration:latest . && \
     docker run --env-file .env.local migration:latest
     ```

2. **Option B: Create Separate Migration Service**
   - In Coolify, create a new Application for migrations
   - Set it to run on a schedule (cron)
   - Configure with the same environment variables
   - The migration will run periodically

### Getting Your Supabase Connection Details

1. **SSH into your Coolify server**
2. **Find the Supabase container:**
   ```bash
   docker ps | grep supabase
   ```

3. **Get the database URL from container logs or Coolify dashboard**

4. **Set environment variables in Coolify:**
   - Go to Application → Environment Variables
   - Add the Supabase database credentials

---

## Environment Variables

### Required (choose one method)

**Method 1: Individual Variables**
```
SUPABASE_DB_HOST=        # Coolify server IP or hostname
SUPABASE_DB_PORT=        # Usually 5432
SUPABASE_DB_NAME=        # Usually 'pairwise' or 'postgres'
SUPABASE_DB_USER=        # Usually 'postgres'
SUPABASE_DB_PASSWORD=    # Your database password
```

**Method 2: Connection String**
```
SUPABASE_DB_URL=postgresql://user:password@host:5432/dbname
```

### Optional
```
NODE_ENV=production      # Enables SSL for production databases
```

---

## Testing the Migration

### Test Connection Only
```bash
docker run \
  -e SUPABASE_DB_HOST=localhost \
  -e SUPABASE_DB_USER=postgres \
  -e SUPABASE_DB_PASSWORD=password \
  -e SUPABASE_DB_NAME=postgres \
  --entrypoint psql \
  pairwise-migration \
  -h localhost -U postgres -d postgres -c "SELECT 1"
```

### View Migration Status
After running the migration, verify it worked:

```bash
# Connect to Supabase database
psql postgresql://postgres:password@host:5432/pairwise

# Check if tables exist
\dt public.*

# You should see all 12 tables:
# - profiles
# - households
# - household_members
# - invites
# - income_sources
# - categories
# - incomes
# - monthly_categories
# - expenses
# - savings_goals
# - savings_contributions
# - alerts
```

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
- Verify `SUPABASE_DB_HOST` is correct (not localhost if running from Docker)
- Check that Supabase is running in Coolify
- Verify firewall allows the connection

### Authentication Failed
```
Error: password authentication failed for user "postgres"
```
- Double-check `SUPABASE_DB_USER` and `SUPABASE_DB_PASSWORD`
- Ensure password doesn't have special characters that need escaping
- Try connecting manually with `psql` to verify credentials

### Permission Denied
```
Error: permission denied for schema public
```
- User doesn't have sufficient privileges
- Use `postgres` superuser account
- Or grant privileges to the user:
  ```sql
  GRANT ALL PRIVILEGES ON SCHEMA public TO your_user;
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
  ```

### Migration Already Applied
The script will fail if tables already exist (idempotency).

**Solution:**
1. Back up your database
2. Drop existing tables:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
3. Re-run the migration

**To make it idempotent** (only in development):
- Modify the SQL to use `CREATE TABLE IF NOT EXISTS`

---

## Production Considerations

### Security
- Never commit `.env.migration` with real credentials
- Use Coolify's secret management for credentials
- Use strong, randomly generated passwords
- Enable SSL/TLS for database connections

### Backups
Before running migrations in production:
```bash
# Backup database
pg_dump postgresql://user:password@host:5432/dbname > backup.sql

# Test migration on backup first
psql postgresql://user:password@test-host:5432/test < backup.sql
# Then run migration on test database
```

### Idempotent Migrations
The current migration will fail if run twice. For production automation:

1. **Option A:** Only run on fresh databases
2. **Option B:** Modify migration to check existence:
   ```sql
   CREATE TABLE IF NOT EXISTS public.profiles (
     -- ...
   );
   ```
3. **Option C:** Use a migration versioning system

---

## Running Migrations Locally

For development testing:

```bash
# Assume Supabase running on localhost:5432
SUPABASE_DB_HOST=localhost \
SUPABASE_DB_USER=postgres \
SUPABASE_DB_PASSWORD=postgres \
SUPABASE_DB_NAME=postgres \
node scripts/run-migration.js
```

Or directly with psql:
```bash
psql postgresql://postgres:password@localhost:5432/postgres -f supabase/migrations/001_initial_schema.sql
```

---

## What the Migration Does

The `001_initial_schema.sql` creates:

### Tables (12 total)
1. `profiles` - User profiles (extends auth.users)
2. `households` - Household groups
3. `household_members` - Membership records
4. `invites` - Pending invitations
5. `income_sources` - Income categories
6. `categories` - Expense categories
7. `incomes` - Income transactions
8. `monthly_categories` - Monthly budget allocations
9. `expenses` - Expense transactions
10. `savings_goals` - Savings goals
11. `savings_contributions` - Savings progress
12. `alerts` - Budget alerts

### Security
- **RLS (Row Level Security)** enabled on all tables
- **Policies** ensure users only access their household data
- **Indexes** created for common queries
- **Foreign keys** enforce referential integrity

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Run Database Migration

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build migration image
        run: docker build -f Dockerfile.migration -t migration:latest .

      - name: Run migration
        run: docker run \
          -e SUPABASE_DB_HOST=${{ secrets.SUPABASE_DB_HOST }} \
          -e SUPABASE_DB_PORT=5432 \
          -e SUPABASE_DB_NAME=${{ secrets.SUPABASE_DB_NAME }} \
          -e SUPABASE_DB_USER=${{ secrets.SUPABASE_DB_USER }} \
          -e SUPABASE_DB_PASSWORD=${{ secrets.SUPABASE_DB_PASSWORD }} \
          migration:latest
```

### Coolify Webhook
Set up a webhook on your Git repo to trigger Coolify deployment, which runs the migration.

---

## Support

For issues:
- Check PostgreSQL logs: `docker logs <container-id>`
- Verify connectivity: `psql postgresql://...`
- Review `scripts/run-migration.js` for details
- Check migration SQL syntax in `supabase/migrations/001_initial_schema.sql`
