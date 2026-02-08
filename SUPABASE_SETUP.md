1# Self-Hosted Supabase on Coolify Setup Guide

This guide walks you through deploying self-hosted Supabase on Coolify and connecting it to the PairWise Budgeting App.

## Architecture Overview

With Coolify's self-hosted Supabase:
- **Supabase Service**: PostgreSQL database + Auth + Realtime
- **Next.js App**: Your PairWise budgeting application
- **Email Service**: Resend for transactional emails
- **Hosting**: All on Coolify

## Prerequisites

- A Coolify server/instance running and accessible
- Docker installed on your Coolify server (pre-installed with Coolify)
- Resend account for email service (free tier available)
- Node.js and npm installed (for local development)

---

## Phase 1: Deploy Supabase on Coolify

### Step 1: Access Coolify Dashboard

1. Log in to your Coolify dashboard
2. Navigate to **Services**
3. Click **Add New Service**
4. Search for **Supabase** in the available services

### Step 2: Configure Supabase Service

1. Click on Supabase to deploy it
2. Fill in the configuration:
   - **Name**: `pairwise-supabase` (or your preferred name)
   - **Database Password**: Create a strong password (save this safely)
   - **Domain**: Set a domain for accessing Supabase (e.g., `supabase.yourdomain.com`)
   - **Port**: Default is fine, or customize if needed

3. Configure environment variables:
   - `POSTGRES_PASSWORD`: Your database password
   - `JWT_SECRET`: Generate a strong random string (at least 32 characters)
   - `ANON_KEY`: Generate a random string for anonymous access
   - `SERVICE_ROLE_KEY`: Generate a random string for service operations

   To generate random keys, use:
   ```bash
   # Generate 32-byte random string (base64 encoded)
   openssl rand -base64 32
   ```

4. Click **Deploy Service**
5. Wait for Supabase to initialize (5-10 minutes)

### Step 3: Access Your Self-Hosted Supabase

1. Once deployed, Coolify will provide you with:
   - **Supabase Dashboard URL**: Usually at your configured domain
   - **Database URL**: PostgreSQL connection string
   - **API URL**: For API requests

2. Log in to the Supabase dashboard using default credentials:
   - Email: `supabase`
   - Password: `this_password_is_insecure_and_should_be_changed`

3. **IMPORTANT**: Change the default credentials immediately in Supabase settings

---

## Phase 2: Set Up Database Schema

### Step 1: Connect to Your Supabase Instance

1. In Coolify Supabase dashboard, go to **SQL Editor**
2. Click **New Query**

### Step 2: Run Migration

1. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
2. Paste it into the SQL editor
3. Click **Run**
4. Verify all statements executed successfully

### Step 3: Enable Authentication

1. Go to **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. Configure authentication settings if needed

---

## Phase 3: Configure Your Next.js App

### Step 1: Get API Keys from Coolify

1. In Coolify Supabase dashboard, go to **Settings → API**
2. Copy these values:
   - **Project URL** (typically: `https://supabase.yourdomain.com`)
   - **Anon Key** (from your configuration)
   - **Service Role Key** (from your configuration)

### Step 2: Create Environment Variables

1. Copy the example to create `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your self-hosted Supabase values:
   ```
   # Supabase - Self-Hosted
   NEXT_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

   # Email Service
   RESEND_API_KEY=your_resend_api_key_here

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # For local dev
   ```

3. Get a Resend API key:
   - Go to [https://resend.com](https://resend.com)
   - Sign up and create an API key
   - Add it to `.env.local`

### Step 3: Test Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit [http://localhost:3000](http://localhost:3000)

3. Try [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - Should redirect to `/login` (correct behavior)

---

## Phase 4: Deploy to Coolify

### Step 1: Create a New Application Service

1. In Coolify, go to **Applications**
2. Click **Add New Application**
3. Select your Git repository
4. Configure deployment:
   - **Name**: `pairwise-app`
   - **Port**: `3000`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Step 2: Set Environment Variables in Coolify

1. In your Coolify application settings, go to **Environment Variables**
2. Add the same environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
   ```

3. Click **Save**

### Step 3: Deploy

1. Click **Deploy**
2. Coolify will build and deploy your application
3. Your app will be accessible at your configured domain

---

## Troubleshooting

### Supabase Won't Start
- Check Coolify logs: **Services → Supabase → Logs**
- Verify all required environment variables are set
- Ensure database password is strong and properly escaped

### Cannot Connect to Database
- Check that `NEXT_PUBLIC_SUPABASE_URL` points to your Coolify Supabase domain
- Verify the URL is accessible from your application
- Check Coolify firewall settings

### Authentication Fails
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` matches your Supabase config
- Check that JWT_SECRET in Supabase matches your ANON_KEY derivation
- Review Supabase logs for auth errors

### Email Not Sending
- Verify `RESEND_API_KEY` is correct
- Check Resend account status and domain verification
- Review application logs for email errors

---

## Important Security Notes

⚠️ **Never commit `.env.local`** - Already in `.gitignore`

⚠️ **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - Never expose to client

⚠️ **Change Default Supabase Credentials** - Immediately after deployment

⚠️ **Use HTTPS** - Set up SSL/TLS for your Coolify domains

⚠️ **Database Backups** - Configure automated backups in Coolify

⚠️ **Row Level Security** - All operations protected by RLS policies

---

## Next Steps

After deployment:

1. **Authentication pages** available at:
   - `/signup` - Create account
   - `/login` - Log in
   - `/forgot-password` - Reset password

2. **Onboarding** will guide new users to create households

3. **Access the app** at your configured domain

---

## Maintenance

### Regular Tasks

1. **Monitor Supabase**: Check Coolify dashboard for resource usage
2. **Database Backups**: Verify automated backups are running
3. **Updates**: Keep Supabase and Docker images updated
4. **Logs**: Monitor application and database logs for errors

### Scaling

If your app grows:
1. Increase Coolify server resources
2. Configure database connection pooling
3. Monitor performance metrics

---

## Support

For more information:
- [Coolify Supabase Docs](https://coolify.io/docs/services/supabase)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [Resend Docs](https://resend.com/docs)
