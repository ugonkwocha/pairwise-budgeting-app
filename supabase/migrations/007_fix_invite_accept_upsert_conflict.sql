-- Avoid PL/pgSQL ambiguity between output columns and upsert conflict targets.

CREATE OR REPLACE FUNCTION public.accept_household_invite(invite_token text)
RETURNS TABLE (
  household_id uuid,
  household_name text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_row public.invites%ROWTYPE;
  user_email text;
  profile_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to accept an invite';
  END IF;

  SELECT lower(au.email)
  INTO user_email
  FROM auth.users au
  WHERE au.id = auth.uid();

  SELECT i.*
  INTO invite_row
  FROM public.invites i
  WHERE i.token = invite_token
  LIMIT 1;

  IF invite_row.id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF invite_row.accepted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Invite has already been accepted';
  END IF;

  IF invite_row.expires_at < now() THEN
    RAISE EXCEPTION 'Invite has expired';
  END IF;

  IF lower(invite_row.email) <> user_email THEN
    RAISE EXCEPTION 'This invite was sent to %, but you are signed in as %', invite_row.email, user_email;
  END IF;

  INSERT INTO public.household_members (household_id, user_id, role, status)
  VALUES (invite_row.household_id, auth.uid(), invite_row.role, 'active')
  ON CONFLICT ON CONSTRAINT household_members_household_id_user_id_key
  DO UPDATE SET role = EXCLUDED.role, status = 'active', joined_at = now();

  SELECT COALESCE(p.name, split_part(user_email, '@', 1), 'Member')
  INTO profile_name
  FROM public.profiles p
  WHERE p.id = auth.uid();

  UPDATE public.budget_members bm
  SET auth_user_id = auth.uid(),
      name = COALESCE(NULLIF(bm.name, ''), profile_name),
      email = user_email,
      role = invite_row.role
  WHERE bm.id = invite_row.budget_member_id
     OR (bm.household_id = invite_row.household_id AND lower(bm.email) = user_email);

  UPDATE public.invites i
  SET accepted_at = now()
  WHERE i.id = invite_row.id;

  RETURN QUERY
  SELECT h.id, h.name, invite_row.role
  FROM public.households h
  WHERE h.id = invite_row.household_id;
END;
$$;
