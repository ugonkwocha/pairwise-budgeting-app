-- Let the app distinguish "not onboarded" from "removed from a household".
-- This reveals only the signed-in user's own membership status.

CREATE OR REPLACE FUNCTION public.get_my_household_access_status()
RETURNS TABLE (
  household_id uuid,
  household_name text,
  status text,
  role text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT hm.household_id, h.name, hm.status, hm.role
  FROM public.household_members hm
  JOIN public.households h ON h.id = hm.household_id
  WHERE hm.user_id = auth.uid()
  ORDER BY
    CASE hm.status
      WHEN 'active' THEN 0
      WHEN 'removed' THEN 1
      ELSE 2
    END,
    hm.created_at DESC
  LIMIT 1;
$$;
