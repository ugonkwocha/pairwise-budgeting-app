-- Recurring income, recurring expenses, and bill due dates.

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  source_id uuid REFERENCES public.income_sources(id) ON DELETE SET NULL,
  source_name text,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name text,
  needs_or_wants text CHECK (needs_or_wants IS NULL OR needs_or_wants IN ('needs', 'wants')),
  budget_member_id uuid REFERENCES public.budget_members(id) ON DELETE SET NULL,
  user_name text NOT NULL DEFAULT 'Household',
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL,
  next_due_date date NOT NULL,
  end_date date,
  notes text,
  auto_post boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (type = 'income' AND source_name IS NOT NULL AND category_id IS NULL AND category_name IS NULL)
    OR
    (type = 'expense' AND category_name IS NOT NULL AND source_id IS NULL AND source_name IS NULL)
  ),
  CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_household_due
  ON public.recurring_transactions(household_id, is_active, next_due_date);

CREATE INDEX IF NOT EXISTS idx_recurring_transactions_budget_member
  ON public.recurring_transactions(budget_member_id);

CREATE OR REPLACE FUNCTION public.set_recurring_transactions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_recurring_transactions_updated_at
  ON public.recurring_transactions;

CREATE TRIGGER set_recurring_transactions_updated_at
BEFORE UPDATE ON public.recurring_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_recurring_transactions_updated_at();

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active household members can view recurring transactions"
  ON public.recurring_transactions;

CREATE POLICY "Active household members can view recurring transactions"
  ON public.recurring_transactions FOR SELECT
  USING (public.is_active_household_member(household_id));

DROP POLICY IF EXISTS "Active household members can manage recurring transactions"
  ON public.recurring_transactions;

CREATE POLICY "Active household members can manage recurring transactions"
  ON public.recurring_transactions FOR ALL
  USING (public.is_active_household_member(household_id))
  WITH CHECK (public.is_active_household_member(household_id));
