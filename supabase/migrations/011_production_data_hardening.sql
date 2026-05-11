-- Production hardening: constraints, attribution, and clearer permission boundaries.

ALTER TABLE public.incomes
  ADD COLUMN IF NOT EXISTS budget_member_id uuid REFERENCES public.budget_members(id) ON DELETE SET NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS budget_member_id uuid REFERENCES public.budget_members(id) ON DELETE SET NULL;

ALTER TABLE public.savings_contributions
  ADD COLUMN IF NOT EXISTS budget_member_id uuid REFERENCES public.budget_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.categories
  ALTER COLUMN needs_or_wants SET DEFAULT 'needs';

UPDATE public.incomes i
SET budget_member_id = bm.id
FROM public.budget_members bm
WHERE i.budget_member_id IS NULL
  AND bm.household_id = i.household_id
  AND lower(bm.name) = lower(i.user_name);

UPDATE public.expenses e
SET budget_member_id = bm.id
FROM public.budget_members bm
WHERE e.budget_member_id IS NULL
  AND bm.household_id = e.household_id
  AND lower(bm.name) = lower(e.user_name);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'incomes_amount_positive'
  ) THEN
    ALTER TABLE public.incomes
      ADD CONSTRAINT incomes_amount_positive CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_amount_positive'
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'categories_monthly_budget_nonnegative'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT categories_monthly_budget_nonnegative CHECK (monthly_budget >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_categories_amounts_nonnegative'
  ) THEN
    ALTER TABLE public.monthly_categories
      ADD CONSTRAINT monthly_categories_amounts_nonnegative CHECK (
        budget >= 0
        AND current_spent >= 0
        AND carry_over_amount >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'savings_goals_amounts_nonnegative'
  ) THEN
    ALTER TABLE public.savings_goals
      ADD CONSTRAINT savings_goals_amounts_nonnegative CHECK (
        target_amount >= 0
        AND current_amount >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'savings_contributions_amount_positive'
  ) THEN
    ALTER TABLE public.savings_contributions
      ADD CONSTRAINT savings_contributions_amount_positive CHECK (amount > 0);
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_categories_household_category_month_unique
  ON public.monthly_categories(household_id, category_id, month);

CREATE UNIQUE INDEX IF NOT EXISTS idx_income_sources_household_lower_name_unique
  ON public.income_sources(household_id, lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_household_lower_name_unique
  ON public.categories(household_id, lower(name));

CREATE INDEX IF NOT EXISTS idx_incomes_budget_member
  ON public.incomes(budget_member_id);

CREATE INDEX IF NOT EXISTS idx_expenses_budget_member
  ON public.expenses(budget_member_id);

DROP POLICY IF EXISTS "Users can manage income sources in their households"
  ON public.income_sources;

DROP POLICY IF EXISTS "Primary members can manage income sources in their households"
  ON public.income_sources;

CREATE POLICY "Primary members can manage income sources in their households"
  ON public.income_sources FOR ALL
  USING (public.is_primary_household_member(household_id))
  WITH CHECK (public.is_primary_household_member(household_id));

DROP POLICY IF EXISTS "Users can manage categories in their households"
  ON public.categories;

DROP POLICY IF EXISTS "Primary members can manage categories in their households"
  ON public.categories;

CREATE POLICY "Primary members can manage categories in their households"
  ON public.categories FOR ALL
  USING (public.is_primary_household_member(household_id))
  WITH CHECK (public.is_primary_household_member(household_id));

DROP POLICY IF EXISTS "Users can manage monthly budgets in their households"
  ON public.monthly_categories;

DROP POLICY IF EXISTS "Primary members can manage monthly budgets in their households"
  ON public.monthly_categories;

CREATE POLICY "Primary members can manage monthly budgets in their households"
  ON public.monthly_categories FOR ALL
  USING (public.is_primary_household_member(household_id))
  WITH CHECK (public.is_primary_household_member(household_id));
