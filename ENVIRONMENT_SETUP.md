# Environment Variables Setup Guide

Reference for configuring environment variables across different deployment environments.

## Quick Reference

| Variable | Purpose | Where to Get | Scope |
|----------|---------|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API endpoint | Coolify Supabase dashboard | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Coolify Supabase settings | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server operations | Coolify Supabase settings | Server only |
| `RESEND_API_KEY` | Email service API key | Resend dashboard | Server only |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | Your domain/IP | Client |

---

## Setup by Environment

### Development (Local)

**File:** `.env.local`

```env
# Supabase (local or dev Coolify instance)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service role (only for testing, DON'T use in production)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email
RESEND_API_KEY=re_your_test_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging (Coolify)

**Location:** Coolify Application → Environment Variables

```env
# Supabase (self-hosted on Coolify)
NEXT_PUBLIC_SUPABASE_URL=https://supabase-staging.yourdomain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_anon_key

# Service role
SUPABASE_SERVICE_ROLE_KEY=your_staging_service_role_key

# Email
RESEND_API_KEY=re_your_staging_key

# App
NEXT_PUBLIC_APP_URL=https://app-staging.yourdomain.com
NODE_ENV=production
```

### Production (Coolify)

**Location:** Coolify Application → Environment Variables

```env
# Supabase (self-hosted on Coolify)
NEXT_PUBLIC_SUPABASE_URL=https://supabase.yourdomain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# Service role
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Email
RESEND_API_KEY=re_your_production_key

# App
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
NODE_ENV=production
```

---

## Getting Your Keys

### From Coolify Supabase

1. Log in to Coolify
2. Click **Services** → **pairwise-supabase**
3. Go to **Environment Variables** or **Settings**
4. Find or retrieve:
   - `JWT_SECRET` or `ANON_KEY` → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SERVICE_ROLE_KEY` → Use as `SUPABASE_SERVICE_ROLE_KEY`
5. Your Supabase URL is: `https://supabase.yourdomain.com`

### From Resend

1. Log in to [Resend Dashboard](https://resend.com)
2. Go to **API Keys**
3. Copy your API key
4. Use as `RESEND_API_KEY`

---

## Setting Up in Coolify

### For Your Next.js Application

1. In Coolify, click **Applications** → **pairwise-app**
2. Go to **Environment Variables**
3. Click **Add Environment Variable** for each:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.yourdomain.com` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key from Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your service role key from Supabase |
   | `RESEND_API_KEY` | Your key from Resend |
   | `NEXT_PUBLIC_APP_URL` | `https://app.yourdomain.com` |
   | `NODE_ENV` | `production` |

4. Click **Save**
5. Click **Restart** to apply changes

---

## Important Notes

### 🔒 Secure Keys (Server-Only)

These should NEVER be visible in browser:
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

**Verification:**
1. Open browser DevTools (F12)
2. Go to **Console**
3. Type: `process.env.SUPABASE_SERVICE_ROLE_KEY`
4. Should return `undefined` (correct behavior)

### 📱 Public Keys

These are safe to expose:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

They're prefixed with `NEXT_PUBLIC_` so Next.js knows to expose them.

---

## Verification Checklist

After setting up environment variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is accessible in browser (can visit the URL)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not undefined in browser
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is undefined in browser (server-side only)
- [ ] Application can connect to Supabase (no auth errors in logs)
- [ ] Emails send successfully (check Resend logs)
- [ ] API responses work (test with curl or Postman)

---

## Troubleshooting

### "Missing Supabase environment variables"

**Fix:**
1. Verify all variables are set in Coolify
2. Restart the application
3. Check for typos in variable names
4. Ensure values don't have extra spaces

### "Cannot POST to Supabase"

**Likely cause:** Wrong `NEXT_PUBLIC_SUPABASE_URL`

**Fix:**
1. Verify URL is accessible: Visit it in browser
2. Should see Supabase dashboard
3. Copy exact URL from browser address bar

### "JWT claims do not match"

**Likely cause:** Wrong `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Fix:**
1. Get fresh key from Supabase: Settings → API → Anon Key
2. Update in Coolify environment variables
3. Restart application

### "Emails not sending"

**Likely cause:** Wrong `RESEND_API_KEY`

**Fix:**
1. Verify API key in Resend dashboard
2. Check API key is active
3. Verify sending domain is configured in Resend
4. Update key in Coolify
5. Restart application

---

## Managing Secrets Safely

### Best Practices

1. **Never commit `.env.local`** (it's in `.gitignore`)
2. **Use `.env.local.example`** for reference only
3. **Set variables in Coolify dashboard**, not in code
4. **Rotate keys regularly** (monthly recommended)
5. **Use different keys for dev/staging/prod**
6. **Store backup copies securely** (encrypted vault)

### Key Rotation

When rotating keys:

1. **Create new key** in service (Supabase/Resend)
2. **Update in Coolify** environment variables
3. **Restart application**
4. **Verify everything works**
5. **Delete old key** from service

---

## Quick Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Coolify
- [ ] No hardcoded secrets in code
- [ ] `.env.local` is in `.gitignore`
- [ ] Tested locally with correct keys
- [ ] Resend API key is production key
- [ ] SSL/TLS enabled for all domains
- [ ] Domain names are correct in variables
- [ ] Application starts without errors
- [ ] Can sign up and receive emails
- [ ] Can log in and access dashboard

---

## Reference: Full List of Variables

Complete list of all environment variables used in PairWise:

```env
# Required - Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=                    # Your Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=              # Supabase anonymous/public key
SUPABASE_SERVICE_ROLE_KEY=                  # Supabase service role (server only)

# Required - Email Service
RESEND_API_KEY=                             # Resend API key for sending emails

# Required - App Configuration
NEXT_PUBLIC_APP_URL=                        # Your app's public URL

# Recommended - Next.js Configuration
NODE_ENV=production                         # Set to 'production' on Coolify
```

That's it! PairWise uses only 6 environment variables total.
