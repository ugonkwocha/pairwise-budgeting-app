-- Keep savings goal balances accurate as contributions are added or removed.

ALTER TABLE public.savings_goals
  ADD COLUMN IF NOT EXISTS starting_amount numeric NOT NULL DEFAULT 0;

UPDATE public.savings_goals
SET starting_amount = current_amount
WHERE starting_amount = 0
  AND current_amount > 0;

CREATE INDEX IF NOT EXISTS idx_savings_contributions_goal_date
  ON public.savings_contributions(goal_id, date);

CREATE INDEX IF NOT EXISTS idx_savings_contributions_budget_member
  ON public.savings_contributions(budget_member_id);

CREATE OR REPLACE FUNCTION public.refresh_savings_goal_current_amount(target_goal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.savings_goals
  SET current_amount = starting_amount + COALESCE((
    SELECT SUM(amount)
    FROM public.savings_contributions
    WHERE goal_id = target_goal_id
  ), 0),
  updated_at = now()
  WHERE id = target_goal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_savings_goal_current_amount()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_savings_goal_current_amount(OLD.goal_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_savings_goal_current_amount(NEW.goal_id);

  IF TG_OP = 'UPDATE' AND OLD.goal_id IS DISTINCT FROM NEW.goal_id THEN
    PERFORM public.refresh_savings_goal_current_amount(OLD.goal_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_savings_goal_current_amount
  ON public.savings_contributions;

CREATE TRIGGER sync_savings_goal_current_amount
AFTER INSERT OR UPDATE OR DELETE ON public.savings_contributions
FOR EACH ROW
EXECUTE FUNCTION public.sync_savings_goal_current_amount();

DO $$
DECLARE
  goal_record record;
BEGIN
  FOR goal_record IN SELECT id FROM public.savings_goals LOOP
    PERFORM public.refresh_savings_goal_current_amount(goal_record.id);
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Users can view savings goals in their households"
  ON public.savings_goals;

CREATE POLICY "Users can view savings goals in their households"
  ON public.savings_goals FOR SELECT
  USING (public.is_active_household_member(household_id));

DROP POLICY IF EXISTS "Users can manage savings goals in their households"
  ON public.savings_goals;

CREATE POLICY "Active members can manage savings goals in their households"
  ON public.savings_goals FOR ALL
  USING (public.is_active_household_member(household_id))
  WITH CHECK (public.is_active_household_member(household_id));

DROP POLICY IF EXISTS "Users can view savings contributions in their households"
  ON public.savings_contributions;

CREATE POLICY "Users can view savings contributions in their households"
  ON public.savings_contributions FOR SELECT
  USING (public.is_active_household_member(household_id));

DROP POLICY IF EXISTS "Users can manage savings contributions in their households"
  ON public.savings_contributions;

CREATE POLICY "Active members can manage savings contributions in their households"
  ON public.savings_contributions FOR ALL
  USING (public.is_active_household_member(household_id))
  WITH CHECK (public.is_active_household_member(household_id));
