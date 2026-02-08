# Coolify Deployment Guide

Complete guide for deploying PairWise Budgeting App with self-hosted Supabase on Coolify.

## Prerequisites

- Coolify instance running and accessible
- GitHub repository with your code pushed
- A domain name (or use Coolify's built-in domain)
- Resend account for emails

## Architecture

```
┌─────────────────────────────────────────┐
│         Your Domain                     │
│  (e.g., yourdomain.com)                 │
└──────────┬──────────────────────────────┘
           │
     ┌─────┴─────────────────┐
     │                       │
┌────┴──────────┐    ┌──────┴────────┐
│  Next.js App  │    │   Supabase    │
│  (Port 3000)  │    │ (PostgreSQL)  │
│               │    │   + Auth      │
│  app.yourdom  │    │   + Realtime  │
│    ain.com    │    │               │
└───────────────┘    │  supabase.you │
                     │    rdomain    │
                     │     .com      │
                     └───────────────┘
                            │
                     ┌──────┴──────┐
                     │ Resend API  │
                     │  (Emails)   │
                     └─────────────┘
```

## Deployment Steps

### Phase 1: Prepare Your Repository

1. Ensure your code is pushed to GitHub:
   ```bash
   git status
   git add .
   git commit -m "Add authentication setup"
   git push origin main
   ```

2. Your `.env.local` should NOT be committed (it's in `.gitignore`)

3. `.env.local.example` should be in the repo for reference

### Phase 2: Deploy Supabase Service

#### Step 1: Create Coolify Supabase Service

1. Log in to Coolify dashboard
2. Click **Services** → **Add New Service**
3. Search for and select **Supabase**

#### Step 2: Configure Supabase

1. **Service Name**: `pairwise-supabase`

2. **Database Configuration**:
   - **Postgres Version**: Select latest stable
   - **Database Name**: `pairwise`
   - **Database Username**: `postgres`
   - **Database Password**: Generate a strong password
     ```bash
     # Use this to generate a secure password
     openssl rand -base64 32
     ```

3. **Authentication Configuration**:
   - Generate JWT_SECRET (use openssl command above)
   - Generate ANON_KEY (use openssl command above)
   - Generate SERVICE_ROLE_KEY (use openssl command above)

4. **Network Configuration**:
   - **Domain**: `supabase.yourdomain.com`
   - **SSL**: Enable (Let's Encrypt)
   - **Port**: 443 (default)

5. Click **Deploy Service** and wait for it to start

#### Step 3: Access Supabase Dashboard

1. Visit `https://supabase.yourdomain.com`
2. Default login:
   - Email: `supabase`
   - Password: `this_password_is_insecure_and_should_be_changed`

3. **IMMEDIATELY** change the default password:
   - Click profile icon → Settings
   - Change password
   - Log out and log back in

#### Step 4: Initialize Database

1. In Supabase dashboard, click **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into editor and click **Run**
5. Verify completion in results

#### Step 5: Get API Keys

In Supabase dashboard:
1. Go to **Settings → API**
2. Copy and save:
   - **Project URL** (e.g., `https://supabase.yourdomain.com`)
   - **Anon Key** (from your JWT configuration)
   - **Service Role Key** (from your configuration)

### Phase 3: Deploy Next.js Application

#### Step 1: Create Application Service

1. In Coolify, click **Applications** → **Add New Application**
2. Select your GitHub repository
3. Select the branch: `main` (or your deployment branch)

#### Step 2: Configure Application

1. **Basic Settings**:
   - **Name**: `pairwise-app`
   - **Port**: `3000`
   - **Install Command**: `npm install` (or `npm ci`)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

2. **Domain Configuration**:
   - **Domain**: `app.yourdomain.com`
   - **SSL**: Enable (Let's Encrypt)
   - **Port**: 443

3. **Environment Variables**:
   Click **Add Environment Variable** for each:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_from_step_2_5
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_from_step_2_5
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
   NODE_ENV=production
   ```

4. Click **Save Environment Variables**

#### Step 3: Deploy Application

1. Click **Deploy**
2. Coolify will:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Start the service
3. This typically takes 5-10 minutes

#### Step 4: Verify Deployment

1. Visit `https://app.yourdomain.com`
2. You should see the PairWise home page
3. Try accessing `/dashboard` - should redirect to `/login`

### Phase 4: Set Up SSL/TLS

Coolify can automatically provision Let's Encrypt certificates.

1. For each service (Supabase & App):
   - In Coolify dashboard, go to service settings
   - Enable **SSL**
   - Let Coolify request a Let's Encrypt certificate
   - This happens automatically when you save

2. Verify SSL:
   - Visit https://app.yourdomain.com
   - Check the padlock icon in browser

### Phase 5: Configure DNS

Update your DNS records:

1. **For app**:
   ```
   Type: A
   Name: app
   Value: Your Coolify Server IP
   ```

2. **For Supabase**:
   ```
   Type: A
   Name: supabase
   Value: Your Coolify Server IP
   ```

3. **For domain root** (optional):
   ```
   Type: A
   Name: @ (or leave blank)
   Value: Your Coolify Server IP
   ```

DNS changes can take 5-30 minutes to propagate.

## Post-Deployment

### Step 1: Test Authentication

1. Visit `https://app.yourdomain.com/signup`
2. Create a test account
3. Check your email for confirmation (Resend must be working)
4. Complete signup and create a household
5. Verify you can see the dashboard

### Step 2: Verify Database Connection

In Supabase dashboard:
1. Go to **SQL Editor**
2. Run:
   ```sql
   SELECT COUNT(*) FROM public.household_members;
   ```
3. Should return 1 (your test user)

### Step 3: Check Logs

Coolify provides logs for troubleshooting:

**For Next.js App:**
- Click application → **Logs**
- Look for deployment and runtime errors

**For Supabase:**
- Click service → **Logs**
- Look for database initialization errors

### Step 4: Monitor Resources

Set up monitoring in Coolify:
1. Click **Monitoring**
2. View CPU, Memory, Disk usage
3. Set up alerts if needed

## Troubleshooting

### Application Won't Deploy

**Check logs first:**
```
Application → Logs → see recent errors
```

**Common issues:**
- Missing environment variables
- Build command failing
- Port already in use

**Fix:**
1. Add missing env vars
2. Check `npm run build` works locally
3. Restart service in Coolify

### Can't Connect to Supabase

**Verify connectivity:**
1. Check Supabase is running: `Services → pairwise-supabase → Status`
2. Verify URL: Should be `https://supabase.yourdomain.com`
3. Check firewall: Domain should be accessible from internet

**Test in browser:**
1. Visit `https://supabase.yourdomain.com`
2. Should show Supabase login

### Authentication Fails

**Check environment variables:**
1. Application → Environment Variables
2. Verify all `NEXT_PUBLIC_SUPABASE_*` keys are correct
3. Match exactly what's in Supabase dashboard

**Restart application:**
1. Click application → **Restart**
2. Wait 1-2 minutes for restart

### Email Not Sending

1. Verify `RESEND_API_KEY` is set correctly
2. Check Resend account status
3. Verify sending domain in Resend settings
4. Check application logs for errors

## Maintenance

### Daily
- Monitor logs for errors
- Check application is responsive

### Weekly
- Review resource usage
- Check for any alerts

### Monthly
- Review error logs
- Update dependencies if needed
  ```bash
  npm outdated
  npm update
  ```
- Commit updates and push to trigger redeploy

### Database Backups

For self-hosted PostgreSQL:
1. Configure automated backups in Coolify
2. Backup frequency: At least daily
3. Store backups securely (off-site recommended)

### Updates

To update the application:
1. Make changes locally
2. Commit and push to GitHub
3. Coolify automatically redeploys on push (if enabled)
4. Monitor logs during redeployment

## Security Checklist

- [x] SSL/TLS enabled on all domains
- [ ] Change default Supabase password (do this first!)
- [ ] Set strong database password
- [ ] Enable firewalls in Coolify
- [ ] Regular database backups configured
- [ ] Environment variables not committed to Git
- [ ] Resend API key rotated regularly
- [ ] Monitor logs for suspicious activity
- [ ] Keep Coolify and services updated

## Performance Optimization

### For Application

1. **Enable Caching**:
   - Configure Next.js `revalidate` in ISR
   - Use HTTP caching headers

2. **Database Optimization**:
   - Monitor slow queries in Supabase
   - Add indexes if needed

3. **Monitor Resources**:
   - Watch CPU and memory usage
   - Scale server if needed

### For Database

1. **Connection Pooling**:
   - Consider PgBouncer if many connections
   - Monitor active connections

2. **Query Performance**:
   - Use Supabase query analyzer
   - Index frequently queried columns

## Rollback Plan

If something breaks:

1. **Keep previous working version**:
   - Git tags for stable releases
   - Maintain previous branch

2. **Rollback procedure**:
   ```bash
   git revert <commit-hash>
   git push origin main
   # Coolify redeploys automatically
   ```

3. **Database backup recovery**:
   - Stop current service
   - Restore backup
   - Restart and verify

## Support

- Coolify Docs: https://coolify.io/docs
- Supabase Self-Hosting: https://supabase.com/docs/guides/self-hosting
- Resend: https://resend.com/docs
