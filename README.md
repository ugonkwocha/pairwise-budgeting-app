# Pairwise - Household Budgeting App

A household budgeting application that helps families plan, track, and manage shared finances with shared visibility and no spreadsheets needed.

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase project with Auth enabled
- Supabase/Postgres schema from `supabase/migrations`

### Environment

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For direct SQL migration runs, also provide either:

```bash
SUPABASE_DB_URL=postgresql://user:password@host:port/database
```

or the individual `SUPABASE_DB_HOST`, `SUPABASE_DB_PORT`, `SUPABASE_DB_NAME`, `SUPABASE_DB_USER`, and `SUPABASE_DB_PASSWORD` variables.

### Install And Run

```bash
npm install
npm run migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- **Framework**: Next.js 14 App Router
- **Auth**: Supabase Auth
- **Database**: Supabase/Postgres with Row Level Security
- **State**: React Context backed by Supabase queries/mutations
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## Project Structure

```text
app/                         Next.js pages
components/                  UI, onboarding, analytics, transaction views
lib/contexts/BudgetContext   App state facade used by the UI
lib/supabase/                Supabase client and budget repository
lib/calculations/            Pure budget, alert, transaction, analytics logic
lib/utils/                   Date, month, CSV, and transaction helpers
supabase/migrations/         Supabase SQL schema and RLS policies
types/index.ts               App-level TypeScript models
```

## Product Surface

- Supabase sign up, login, and password reset
- Auth-protected dashboard, onboarding, settings, and budget pages
- Household onboarding
- Budget members, income sources, categories, and monthly budgets
- Income and expense CRUD
- Monthly budget creation with carry-over
- Transaction history with filters and sorting
- Analytics and CSV export
- Budget alerts for warning and over-budget states

## Development

```bash
npm run build
npm run lint
npm run migrate
```

Migrations are plain SQL files in `supabase/migrations` and are applied in sorted filename order by `scripts/run-migration.js`.

## Vercel Environments

This app uses two long-lived branches:

- `develop` deploys to Vercel Preview/Staging.
- `main` deploys to Vercel Production.

Use the separate PairWise Vercel account for this project. If another Vercel account is logged in globally, do not run plain `vercel` commands. Use a token from the PairWise Vercel account instead:

```bash
VERCEL_TOKEN="token_from_pairwise_vercel_account"
npx vercel link --token "$VERCEL_TOKEN"
npx vercel --token "$VERCEL_TOKEN"
```

Use separate Supabase projects for staging and production. Each Vercel environment should have its own values:

```bash
NEXT_PUBLIC_APP_URL=https://your-environment-domain
NEXT_PUBLIC_SUPABASE_URL=your_environment_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_environment_supabase_anon_key
SUPABASE_DB_URL=your_environment_postgres_connection_string
```

Supabase Auth redirect URLs must include:

```text
https://your-environment-domain/auth/callback
```

Apply migrations to staging first:

```bash
SUPABASE_DB_URL="staging_database_url" npm run migrate
```

After staging is verified, merge `develop` into `main` and apply the same migrations to production:

```bash
SUPABASE_DB_URL="production_database_url" npm run migrate
```
