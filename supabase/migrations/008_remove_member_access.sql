-- Removing a budget member must also revoke their authenticated household access.
-- budget_members drives attribution/display; household_members drives RLS access.

CREATE OR REPLACE FUNCTION public.remove_budget_member(target_budget_member_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member_record public.budget_members%ROWTYPE;
  remaining_member_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to remove a member';
  END IF;

  SELECT *
  INTO member_record
  FROM public.budget_members
  WHERE id = target_budget_member_id;

  IF member_record.id IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF NOT public.is_primary_household_member(member_record.household_id) THEN
    RAISE EXCEPTION 'Only a primary household member can remove members';
  END IF;

  IF member_record.role = 'primary' THEN
    RAISE EXCEPTION 'Primary members cannot be removed';
  END IF;

  IF member_record.auth_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove your own account';
  END IF;

  SELECT count(*)
  INTO remaining_member_count
  FROM public.budget_members
  WHERE household_id = member_record.household_id
    AND id <> target_budget_member_id;

  IF remaining_member_count < 1 THEN
    RAISE EXCEPTION 'A household must have at least one member';
  END IF;

  DELETE FROM public.invites
  WHERE budget_member_id = target_budget_member_id
    AND accepted_at IS NULL;

  IF member_record.auth_user_id IS NOT NULL THEN
    UPDATE public.household_members
    SET status = 'removed'
    WHERE household_id = member_record.household_id
      AND user_id = member_record.auth_user_id;
  END IF;

  DELETE FROM public.budget_members
  WHERE id = target_budget_member_id;
END;
$$;

DROP POLICY IF EXISTS "Users can manage budget members in their households"
  ON public.budget_members;

DROP POLICY IF EXISTS "Primary members can manage budget members in their households"
  ON public.budget_members;

CREATE POLICY "Primary members can manage budget members in their households"
  ON public.budget_members FOR ALL
  USING (public.is_primary_household_member(household_id))
  WITH CHECK (public.is_primary_household_member(household_id));
