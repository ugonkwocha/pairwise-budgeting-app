CREATE OR REPLACE FUNCTION public.create_household_setup(
  household_name text,
  household_currency text,
  budget_month text,
  members jsonb,
  income_sources jsonb,
  categories jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  new_household_id uuid;
  item jsonb;
  member_index integer := 0;
  new_category_id uuid;
  category_budget numeric;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to create a household';
  END IF;

  INSERT INTO public.households (name, currency, created_by_user_id)
  VALUES (household_name, household_currency, current_user_id)
  RETURNING id INTO new_household_id;

  INSERT INTO public.household_members (household_id, user_id, role, status)
  VALUES (new_household_id, current_user_id, 'primary', 'active')
  ON CONFLICT (household_id, user_id) DO UPDATE
  SET role = 'primary', status = 'active';

  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(members, '[]'::jsonb))
  LOOP
    IF NULLIF(BTRIM(item->>'name'), '') IS NOT NULL THEN
      INSERT INTO public.budget_members (
        household_id,
        auth_user_id,
        name,
        email,
        role
      )
      VALUES (
        new_household_id,
        CASE WHEN member_index = 0 THEN current_user_id ELSE NULL END,
        BTRIM(item->>'name'),
        COALESCE(NULLIF(BTRIM(item->>'email'), ''), ''),
        CASE WHEN member_index = 0 THEN 'primary' ELSE COALESCE(NULLIF(item->>'role', ''), 'member') END
      );

      member_index := member_index + 1;
    END IF;
  END LOOP;

  IF member_index = 0 THEN
    INSERT INTO public.budget_members (household_id, auth_user_id, name, email, role)
    SELECT
      new_household_id,
      current_user_id,
      COALESCE(NULLIF(name, ''), split_part(COALESCE(email, ''), '@', 1), 'Primary member'),
      COALESCE(email, ''),
      'primary'
    FROM public.profiles
    WHERE id = current_user_id;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(income_sources, '[]'::jsonb))
  LOOP
    IF NULLIF(BTRIM(item->>'name'), '') IS NOT NULL THEN
      INSERT INTO public.income_sources (household_id, name, description)
      VALUES (
        new_household_id,
        BTRIM(item->>'name'),
        NULLIF(BTRIM(COALESCE(item->>'description', '')), '')
      );
    END IF;
  END LOOP;

  FOR item IN SELECT * FROM jsonb_array_elements(COALESCE(categories, '[]'::jsonb))
  LOOP
    IF NULLIF(BTRIM(item->>'name'), '') IS NOT NULL THEN
      category_budget := COALESCE(NULLIF(item->>'monthlyBudget', '')::numeric, 0);

      INSERT INTO public.categories (
        household_id,
        name,
        color,
        needs_or_wants,
        monthly_budget,
        carry_over_enabled,
        icon
      )
      VALUES (
        new_household_id,
        BTRIM(item->>'name'),
        NULLIF(BTRIM(COALESCE(item->>'color', '')), ''),
        'needs',
        category_budget,
        COALESCE((item->>'carryOverEnabled')::boolean, false),
        NULLIF(BTRIM(COALESCE(item->>'icon', '')), '')
      )
      RETURNING id INTO new_category_id;

      INSERT INTO public.monthly_categories (
        household_id,
        category_id,
        month,
        budget,
        current_spent,
        carry_over_amount
      )
      VALUES (
        new_household_id,
        new_category_id,
        budget_month,
        category_budget,
        0,
        0
      );
    END IF;
  END LOOP;

  RETURN new_household_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_household_setup(text, text, text, jsonb, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_household_setup(text, text, text, jsonb, jsonb, jsonb) TO authenticated;
