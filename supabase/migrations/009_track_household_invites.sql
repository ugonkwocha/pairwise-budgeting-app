-- Surface invite status in the app and make new invite links valid for 30 days.

ALTER TABLE public.invites
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

DROP FUNCTION IF EXISTS public.create_household_invite(text, text, text);

CREATE OR REPLACE FUNCTION public.create_household_invite(
  member_name text,
  member_email text,
  member_role text DEFAULT 'member'
)
RETURNS TABLE (
  invite_id uuid,
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
    AND hm.role = 'primary'
  ORDER BY hm.created_at
  LIMIT 1;

  IF active_household_id IS NULL THEN
    RAISE EXCEPTION 'Only a primary household member can invite members';
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

  INSERT INTO public.invites (household_id, email, role, budget_member_id, invited_by_user_id, expires_at)
  VALUES (active_household_id, normalized_email, normalized_role, created_member.id, auth.uid(), now() + interval '30 days')
  RETURNING * INTO created_invite;

  RETURN QUERY SELECT
    created_invite.id,
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

CREATE OR REPLACE FUNCTION public.delete_household_invite(target_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invite_record public.invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to delete an invite';
  END IF;

  SELECT *
  INTO invite_record
  FROM public.invites
  WHERE id = target_invite_id;

  IF invite_record.id IS NULL THEN
    RAISE EXCEPTION 'Invite not found';
  END IF;

  IF NOT public.is_primary_household_member(invite_record.household_id) THEN
    RAISE EXCEPTION 'Only a primary household member can delete invites';
  END IF;

  DELETE FROM public.invites
  WHERE id = target_invite_id;

  IF invite_record.accepted_at IS NULL AND invite_record.budget_member_id IS NOT NULL THEN
    DELETE FROM public.budget_members
    WHERE id = invite_record.budget_member_id
      AND auth_user_id IS NULL;
  END IF;
END;
$$;
