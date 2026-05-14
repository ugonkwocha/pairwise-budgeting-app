-- Remove unused Prisma-era tables that remained in the public schema without RLS.
-- The app now uses the lowercase Supabase/Postgres tables below, all of which
-- have household-scoped RLS policies.

DROP TABLE IF EXISTS public."Alert" CASCADE;
DROP TABLE IF EXISTS public."SavingsContribution" CASCADE;
DROP TABLE IF EXISTS public."SavingsGoal" CASCADE;
DROP TABLE IF EXISTS public."Expense" CASCADE;
DROP TABLE IF EXISTS public."MonthlyCategory" CASCADE;
DROP TABLE IF EXISTS public."Category" CASCADE;
DROP TABLE IF EXISTS public."Income" CASCADE;
DROP TABLE IF EXISTS public."IncomeSource" CASCADE;
DROP TABLE IF EXISTS public."Invite" CASCADE;
DROP TABLE IF EXISTS public."HouseholdMember" CASCADE;
DROP TABLE IF EXISTS public."Household" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;

-- Migration bookkeeping should never be exposed through the public API.
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.schema_migrations FROM anon;
REVOKE ALL ON public.schema_migrations FROM authenticated;
