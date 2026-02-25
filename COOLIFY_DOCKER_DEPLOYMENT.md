# Coolify Docker Deployment Guide

Complete guide for deploying PairWise app to Coolify using Docker.

## Architecture

Two separate Dockerfiles for different purposes:

```
Database Setup (One-time)
      ↓
Dockerfile.db-init (runs migrations)
      ↓
[✅ Database tables created]
      ↓
      ↓
App Deployment (Regular)
      ↓
Dockerfile (builds and runs app)
      ↓
[✅ App running on port 3000]
```

---

## Deployment Process

### Phase 1: Initial Setup (One-time)

#### Step 1: Deploy Database Service

In Coolify:

1. **Create New Application/Service**
   - Name: `pairwise-db-init`
   - Dockerfile: `Dockerfile.db-init`

2. **Set Environment Variable:**
   ```
   DATABASE_URL=postgresql://postgres:doQQOu7ZAzprjMD6rN9rTce7K7UBNoKs@budgeting-app-db:5432/postgres
   ```

3. **Deploy**
   - Watch logs for: `✅ Database initialized successfully!`
   - Service will exit after migrations complete (this is normal)

#### Step 2: Deploy Application Service

In Coolify:

1. **Create New Application**
   - Name: `pairwise-app`
   - Dockerfile: `Dockerfile` (the main one)

2. **Set Environment Variables:**
   ```
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
   ```

3. **Configure Networking:**
   - Port: `3000`
   - Domain: `app.yourdomain.com`
   - SSL: Enable (Let's Encrypt)

4. **Deploy**
   - App will build and start
   - Visit `https://app.yourdomain.com` to verify

---

### Phase 2: Regular Updates

When you update your code:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **In Coolify:**
   - Go to `pairwise-app` service
   - Click **Redeploy** or **Force Deploy**
   - Coolify pulls latest code from GitHub
   - Docker rebuilds and restarts the app

---

### Phase 3: Schema Changes

When you change the Prisma schema:

1. **Locally:**
   ```bash
   # Update prisma/schema.prisma

   # Create migration
   npx prisma migrate dev --name describe_change

   # Test locally
   npm run dev

   # Push to GitHub
   git add .
   git commit -m "Update schema"
   git push origin main
   ```

2. **In Coolify:**
   - Deploy `pairwise-db-init` first (runs new migration)
   - Then deploy `pairwise-app` (uses new schema)

---

## File Reference

### Dockerfile.db-init
- **Purpose:** Initialize database with migrations
- **When to run:** Once during setup, then only for schema changes
- **Required env vars:** `DATABASE_URL`
- **Exit behavior:** Service exits after migrations complete (expected)

### Dockerfile
- **Purpose:** Build and run Next.js application
- **When to run:** Every code deployment
- **Required env vars:** `NODE_ENV`, `NEXT_PUBLIC_APP_URL`
- **Port:** `3000`

---

## Troubleshooting

### DB-Init Service Fails

**Error:** `Error: The datasource.url property is required...`
- **Cause:** DATABASE_URL not set
- **Fix:** Add DATABASE_URL environment variable in Coolify

**Error:** `relation "..." already exists`
- **Cause:** Migrations already ran
- **Fix:** Normal on subsequent runs, service will exit successfully

### App Won't Start

**Error:** `Error connecting to PostgreSQL`
- **Cause:** App can't reach database
- **Fix:** Verify DATABASE_URL uses correct internal service name (`budgeting-app-db`)

**Error:** `Build failed`
- **Cause:** Usually npm install or build issue
- **Fix:** Check Coolify logs for specific error, push fix to GitHub, redeploy

### Schema Mismatch

**Error:** Database table doesn't exist
- **Cause:** Forgot to run db-init after schema change
- **Fix:** Deploy `pairwise-db-init` to run migrations

---

## Monitoring

### Check Status

In Coolify:

1. **DB-Init Service:**
   - Look in Logs tab
   - Should show: `✅ Database initialized successfully!`
   - Service status will show as "exited" (normal)

2. **App Service:**
   - Look in Logs tab
   - Should show Next.js startup messages
   - Service should stay "running"

### View App

Visit: `https://app.yourdomain.com`

---

## Maintenance

### Regular Tasks

**Weekly:**
- Monitor logs for errors
- Check app responsiveness

**Monthly:**
- Review database size
- Check for any migration warnings

**After Major Changes:**
- Test locally first: `npm run dev`
- Create migration: `npx prisma migrate dev`
- Deploy db-init
- Deploy app

---

## Quick Commands Reference

### Local Development
```bash
# Start dev server
npm run dev

# Create migration after schema change
npx prisma migrate dev --name description

# View database
npx prisma studio
```

### Coolify Deployments
```
DB-Init:    Deploy Dockerfile.db-init with DATABASE_URL
App:        Deploy Dockerfile with NODE_ENV and NEXT_PUBLIC_APP_URL
```

---

## Security Notes

- ✅ DATABASE_URL only set on db-init service
- ✅ App gets DATABASE_URL from db-init during build... wait no, we need to set it
- ⚠️ **IMPORTANT:** App service also needs DATABASE_URL if it needs to access database

**Update:** App service needs DATABASE_URL too:

```
DATABASE_URL=postgresql://postgres:doQQOu7ZAzprjMD6rN9rTce7K7UBNoKs@budgeting-app-db:5432/postgres
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

- ✅ Keep `.env.local` in `.gitignore` (never commit secrets)
- ✅ Use Coolify's environment variable management for secrets
- ✅ Rotate passwords regularly

---

## Success Checklist

- [ ] Created `pairwise-db-init` service in Coolify
- [ ] Set DATABASE_URL on db-init
- [ ] Deployed db-init and saw success message
- [ ] Created `pairwise-app` service in Coolify
- [ ] Set NODE_ENV and NEXT_PUBLIC_APP_URL on app
- [ ] Set DATABASE_URL on app (if accessing database)
- [ ] Deployed app and verified at your domain
- [ ] App is running and accessible
- [ ] Database tables exist and app can read data

---

## Support

For issues:
1. Check Coolify logs (Services → [service name] → Logs)
2. Check this guide's troubleshooting section
3. Review git commits to see recent changes
4. Check Prisma schema in `prisma/schema.prisma`
