-- Align the Supabase schema with the app's budgeting data model.
-- household_members remains the authenticated access-control table.
-- budget_members are the household people used for attributing income/expenses.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.income_sources
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS monthly_budget numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carry_over_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icon text;

ALTER TABLE public.monthly_categories
  ADD COLUMN IF NOT EXISTS current_spent numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carry_over_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.alerts
  ALTER COLUMN threshold DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'danger')),
  ADD COLUMN IF NOT EXISTS message text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dismissed boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.budget_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('primary', 'member')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_members_household
  ON public.budget_members(household_id);

ALTER TABLE public.budget_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_active_household_member(target_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = target_household_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_primary_household_member(target_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members
    WHERE household_id = target_household_id
    AND user_id = auth.uid()
    AND role = 'primary'
    AND status = 'active'
  );
$$;

DROP POLICY IF EXISTS "Users can view households they belong to"
  ON public.households;

CREATE POLICY "Users can view households they belong to"
  ON public.households FOR SELECT
  USING (public.is_active_household_member(id));

DROP POLICY IF EXISTS "Users can view members of their households"
  ON public.household_members;

CREATE POLICY "Users can view members of their households"
  ON public.household_members FOR SELECT
  USING (public.is_active_household_member(household_id));

DROP POLICY IF EXISTS "Primary members can manage household members"
  ON public.household_members;

CREATE POLICY "Primary members can manage household members"
  ON public.household_members FOR ALL
  USING (public.is_primary_household_member(household_id))
  WITH CHECK (public.is_primary_household_member(household_id));

DROP POLICY IF EXISTS "Users can view budget members in their households"
  ON public.budget_members;

CREATE POLICY "Users can view budget members in their households"
  ON public.budget_members FOR SELECT
  USING (public.is_active_household_member(household_id));

DROP POLICY IF EXISTS "Users can manage budget members in their households"
  ON public.budget_members;

CREATE POLICY "Users can manage budget members in their households"
  ON public.budget_members FOR ALL
  USING (public.is_active_household_member(household_id))
  WITH CHECK (public.is_active_household_member(household_id));

DROP POLICY IF EXISTS "Users can create their own households"
  ON public.households;

CREATE POLICY "Users can create their own households"
  ON public.households FOR INSERT
  WITH CHECK (created_by_user_id = auth.uid());

DROP POLICY IF EXISTS "Household creators can update households"
  ON public.households;

CREATE POLICY "Household creators can update households"
  ON public.households FOR UPDATE
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
      AND role = 'primary'
      AND status = 'active'
    )
  )
  WITH CHECK (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
      AND role = 'primary'
      AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can create their own access membership"
  ON public.household_members;

CREATE POLICY "Users can create their own access membership"
  ON public.household_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.households
      WHERE id = household_members.household_id
      AND created_by_user_id = auth.uid()
    )
  );
