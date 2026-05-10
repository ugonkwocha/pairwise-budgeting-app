-- Enable household invite creation and acceptance from the app.

ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member' CHECK (role IN ('primary', 'member')),
  ADD COLUMN IF NOT EXISTS budget_member_id uuid REFERENCES public.budget_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_invites_email
  ON public.invites(lower(email));

CREATE OR REPLACE FUNCTION public.create_household_invite(
  member_name text,
  member_email text,
  member_role text DEFAULT 'member'
)
RETURNS TABLE (
  member_id uuid,
  household_id uuid,
  name text,
  email text,
  role text,
  created_at timestamptz,
  invite_token text,
  invite_expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_household_id uuid;
  normalized_email text;
  normalized_role text;
  created_member public.budget_members%ROWTYPE;
  created_invite public.invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to invite a member';
  END IF;

  SELECT hm.household_id
  INTO active_household_id
  FROM public.household_members hm
  WHERE hm.user_id = auth.uid()
    AND hm.status = 'active'
  ORDER BY hm.created_at
  LIMIT 1;

  IF active_household_id IS NULL THEN
    RAISE EXCEPTION 'No active household found';
  END IF;

  normalized_email := lower(trim(member_email));
  normalized_role := COALESCE(NULLIF(member_role, ''), 'member');

  IF normalized_email = '' OR normalized_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  IF normalized_role NOT IN ('primary', 'member') THEN
    RAISE EXCEPTION 'Invalid member role';
  END IF;

  SELECT *
  INTO created_member
  FROM public.budget_members bm
  WHERE bm.household_id = active_household_id
    AND lower(bm.email) = normalized_email
  LIMIT 1;

  IF created_member.id IS NULL THEN
    INSERT INTO public.budget_members (household_id, name, email, role)
    VALUES (
      active_household_id,
      COALESCE(NULLIF(trim(member_name), ''), split_part(normalized_email, '@', 1)),
      normalized_email,
      normalized_role
    )
    RETURNING * INTO created_member;
  ELSE
    UPDATE public.budget_members
    SET name = COALESCE(NULLIF(trim(member_name), ''), created_member.name),
        role = normalized_role
    WHERE id = created_member.id
    RETURNING * INTO created_member;
  END IF;

  INSERT INTO public.invites (household_id, email, role, budget_member_id, invited_by_user_id)
  VALUES (active_household_id, normalized_email, normalized_role, created_member.id, auth.uid())
  RETURNING * INTO created_invite;

  RETURN QUERY SELECT
    created_member.id,
    created_member.household_id,
    created_member.name,
    created_member.email,
    created_member.role,
    created_member.created_at,
    created_invite.token,
    created_invite.expires_at;
END;
$$;

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

  SELECT lower(email)
  INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  SELECT *
  INTO invite_row
  FROM public.invites
  WHERE token = invite_token
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
  ON CONFLICT (household_id, user_id)
  DO UPDATE SET role = EXCLUDED.role, status = 'active', joined_at = now();

  SELECT COALESCE(p.name, split_part(user_email, '@', 1), 'Member')
  INTO profile_name
  FROM public.profiles p
  WHERE p.id = auth.uid();

  UPDATE public.budget_members
  SET auth_user_id = auth.uid(),
      name = COALESCE(NULLIF(name, ''), profile_name),
      email = user_email,
      role = invite_row.role
  WHERE id = invite_row.budget_member_id
     OR (household_id = invite_row.household_id AND lower(email) = user_email);

  UPDATE public.invites
  SET accepted_at = now()
  WHERE id = invite_row.id;

  RETURN QUERY
  SELECT h.id, h.name, invite_row.role
  FROM public.households h
  WHERE h.id = invite_row.household_id;
END;
$$;
