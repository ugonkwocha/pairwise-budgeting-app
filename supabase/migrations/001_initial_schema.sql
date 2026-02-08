-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create households table
CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  created_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create household_members table
CREATE TABLE public.household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('primary', 'member')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'removed')),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX idx_household_members_user ON public.household_members(user_id);
CREATE INDEX idx_household_members_household ON public.household_members(household_id);

-- Create invites table
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by_user_id uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invites_token ON public.invites(token);
CREATE INDEX idx_invites_household ON public.invites(household_id);

-- Create income_sources table
CREATE TABLE public.income_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  needs_or_wants text NOT NULL CHECK (needs_or_wants IN ('needs', 'wants')),
  created_at timestamptz DEFAULT now()
);

-- Create incomes table
CREATE TABLE public.incomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  source_id uuid REFERENCES public.income_sources(id) ON DELETE SET NULL,
  source_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_incomes_household ON public.incomes(household_id);
CREATE INDEX idx_incomes_date ON public.incomes(date);

-- Create monthly_categories table
CREATE TABLE public.monthly_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month text NOT NULL,
  budget numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  category_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  date date NOT NULL,
  notes text,
  needs_or_wants text NOT NULL CHECK (needs_or_wants IN ('needs', 'wants')),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_expenses_household ON public.expenses(household_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);

-- Create savings_goals table
CREATE TABLE public.savings_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create savings_contributions table
CREATE TABLE public.savings_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  type text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  threshold numeric NOT NULL,
  current_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for households
CREATE POLICY "Users can view households they belong to"
  ON public.households FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for household_members
CREATE POLICY "Users can view members of their households"
  ON public.household_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

CREATE POLICY "Primary members can manage household members"
  ON public.household_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = household_members.household_id
      AND user_id = auth.uid()
      AND role = 'primary'
      AND status = 'active'
    )
  );

-- RLS Policies for invites
CREATE POLICY "Users can create invites for their households"
  ON public.invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = invites.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can view invites for their households"
  ON public.invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = invites.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for income_sources
CREATE POLICY "Users can view income sources in their households"
  ON public.income_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = income_sources.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage income sources in their households"
  ON public.income_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = income_sources.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for categories
CREATE POLICY "Users can view categories in their households"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = categories.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage categories in their households"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = categories.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for incomes
CREATE POLICY "Users can view incomes in their households"
  ON public.incomes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = incomes.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage incomes in their households"
  ON public.incomes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = incomes.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for monthly_categories
CREATE POLICY "Users can view monthly budgets in their households"
  ON public.monthly_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = monthly_categories.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage monthly budgets in their households"
  ON public.monthly_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = monthly_categories.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses in their households"
  ON public.expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = expenses.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage expenses in their households"
  ON public.expenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = expenses.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for savings_goals
CREATE POLICY "Users can view savings goals in their households"
  ON public.savings_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = savings_goals.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage savings goals in their households"
  ON public.savings_goals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = savings_goals.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for savings_contributions
CREATE POLICY "Users can view savings contributions in their households"
  ON public.savings_contributions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = savings_contributions.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage savings contributions in their households"
  ON public.savings_contributions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = savings_contributions.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- RLS Policies for alerts
CREATE POLICY "Users can view alerts in their households"
  ON public.alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = alerts.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

CREATE POLICY "Users can manage alerts in their households"
  ON public.alerts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = alerts.household_id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );
