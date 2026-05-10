'use client';

import { createClient } from '@/lib/supabase/client';
import { INITIAL_STORAGE } from '@/lib/storage/schema';
import type { BudgetStorageSchema } from '@/lib/storage/schema';
import type {
  Alert,
  Category,
  Expense,
  Household,
  Income,
  IncomeSource,
  MonthlyCategory,
  SavingsContribution,
  SavingsGoal,
  User,
  MemberInviteResult,
} from '@/types';

function freshInitialStorage(): BudgetStorageSchema {
  return {
    ...INITIAL_STORAGE,
    currentMonth: new Date().toISOString().slice(0, 7),
    lastMonthCheck: new Date().toISOString(),
  };
}

function requireHouseholdId(data: BudgetStorageSchema): string {
  if (!data.household?.id) {
    throw new Error('No household is loaded');
  }
  return data.household.id;
}

function toHousehold(row: any): Household {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    householdId: row.household_id,
    createdAt: row.created_at,
  };
}

function toIncomeSource(row: any): IncomeSource {
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    createdAt: row.created_at,
  };
}

function toCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    monthlyBudget: Number(row.monthly_budget || 0),
    carryOverEnabled: Boolean(row.carry_over_enabled),
    icon: row.icon || undefined,
    color: row.color || undefined,
    createdAt: row.created_at,
  };
}

function toMonthlyCategory(row: any, categories: Category[]): MonthlyCategory {
  const category = categories.find((c) => c.id === row.category_id);
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category?.name || 'Unknown category',
    monthlyBudget: Number(row.budget || 0),
    currentSpent: Number(row.current_spent || 0),
    carryOverAmount: Number(row.carry_over_amount || 0),
    month: row.month,
    createdAt: row.created_at,
  };
}

function toIncome(row: any): Income {
  return {
    id: row.id,
    amount: Number(row.amount || 0),
    sourceId: row.source_id || '',
    sourceName: row.source_name,
    userId: row.user_id || '',
    userName: row.user_name,
    date: row.date,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || row.user_id || '',
  };
}

function toExpense(row: any): Expense {
  return {
    id: row.id,
    amount: Number(row.amount || 0),
    categoryId: row.category_id || '',
    categoryName: row.category_name,
    needsOrWants: row.needs_or_wants,
    userId: row.user_id || '',
    userName: row.user_name,
    date: row.date,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    createdBy: row.created_by || row.user_id || '',
  };
}

function toSavingsGoal(row: any): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount || 0),
    currentAmount: Number(row.current_amount || 0),
    deadline: row.deadline || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSavingsContribution(row: any, users: User[]): SavingsContribution {
  const user = users[0];
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: Number(row.amount || 0),
    userId: user?.id || '',
    userName: user?.name || 'Household',
    date: row.date,
    createdAt: row.created_at,
  };
}

function toAlert(row: any): Alert {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    categoryId: row.category_id || undefined,
    dismissed: Boolean(row.dismissed),
    createdAt: row.created_at,
  };
}

async function throwIfError<T>(result: { data: T; error: any }): Promise<T> {
  if (result.error) throw result.error;
  return result.data;
}

export async function loadBudgetData(): Promise<{
  data: BudgetStorageSchema;
  isAuthenticated: boolean;
}> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: freshInitialStorage(), isAuthenticated: false };
  }

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  } as any);

  const memberships = await throwIfError(
    await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
  );

  const householdId = memberships?.[0]?.household_id;
  if (!householdId) {
    return { data: freshInitialStorage(), isAuthenticated: true };
  }

  const [household, members, sources, categoryRows, incomes, expenses, goals, alerts] =
    await Promise.all([
      throwIfError(await supabase.from('households').select('*').eq('id', householdId).single()),
      throwIfError(await supabase.from('budget_members' as any).select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('income_sources').select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('categories').select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('incomes').select('*').eq('household_id', householdId).order('date', { ascending: false })),
      throwIfError(await supabase.from('expenses').select('*').eq('household_id', householdId).order('date', { ascending: false })),
      throwIfError(await supabase.from('savings_goals').select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('alerts').select('*').eq('household_id', householdId).order('created_at', { ascending: false })),
    ]);

  const categories = (categoryRows || []).map(toCategory);
  const monthlyRows = await throwIfError(
    await supabase.from('monthly_categories').select('*').eq('household_id', householdId).order('month')
  );
  const users = (members || []).map(toUser);
  const contributions = await throwIfError(
    await supabase.from('savings_contributions').select('*').eq('household_id', householdId).order('date', { ascending: false })
  );

  return {
    isAuthenticated: true,
    data: {
      ...freshInitialStorage(),
      household: toHousehold(household),
      users,
      incomeSources: (sources || []).map(toIncomeSource),
      incomes: (incomes || []).map(toIncome),
      categories,
      monthlyCategories: (monthlyRows || []).map((row: any) => toMonthlyCategory(row, categories)),
      expenses: (expenses || []).map(toExpense),
      savingsGoals: (goals || []).map(toSavingsGoal),
      savingsContributions: (contributions || []).map((row: any) => toSavingsContribution(row, users)),
      alerts: (alerts || []).map(toAlert),
      onboardingCompleted: true,
    },
  };
}

export async function createHouseholdSetup(
  household: Household,
  users: User[],
  incomeSources: IncomeSource[],
  categories: Category[],
  month: string
): Promise<BudgetStorageSchema> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) throw new Error('You must be signed in to create a household');

  await throwIfError(
    await (supabase as any).rpc('create_household_setup', {
      household_name: household.name,
      household_currency: household.currency,
      budget_month: month,
      members: users.map((member) => ({
        name: member.name,
        email: member.email,
        role: member.role,
      })),
      income_sources: incomeSources.map((source) => ({
        name: source.name,
        description: source.description || null,
      })),
      categories: categories.map((category) => ({
        name: category.name,
        monthlyBudget: category.monthlyBudget,
        carryOverEnabled: category.carryOverEnabled,
        color: category.color || null,
        icon: category.icon || null,
      })),
    })
  );

  const result = await loadBudgetData();
  return {
    ...result.data,
    currentMonth: month,
  };
}

export async function insertIncome(income: Omit<Income, 'id' | 'createdAt'>, data: BudgetStorageSchema): Promise<Income> {
  const householdId = requireHouseholdId(data);
  const row = await throwIfError(
    await createClient()
      .from('incomes')
      .insert({
        household_id: householdId,
        amount: income.amount,
        source_id: income.sourceId || null,
        source_name: income.sourceName,
        user_id: null,
        user_name: income.userName,
        date: income.date,
        notes: income.notes || null,
        created_by: null,
      })
      .select('*')
      .single()
  );
  return toIncome(row);
}

export async function updateIncomeRow(incomeId: string, updates: Partial<Income>): Promise<Income> {
  const row = await throwIfError(
    await createClient()
      .from('incomes')
      .update({
        amount: updates.amount,
        source_id: updates.sourceId || undefined,
        source_name: updates.sourceName,
        user_name: updates.userName,
        date: updates.date,
        notes: updates.notes ?? null,
      })
      .eq('id', incomeId)
      .select('*')
      .single()
  );
  return toIncome(row);
}

export async function deleteIncomeRow(incomeId: string): Promise<void> {
  await throwIfError(await createClient().from('incomes').delete().eq('id', incomeId));
}

export async function insertExpense(expense: Omit<Expense, 'id' | 'createdAt'>, data: BudgetStorageSchema): Promise<Expense> {
  const householdId = requireHouseholdId(data);
  const row = await throwIfError(
    await createClient()
      .from('expenses')
      .insert({
        household_id: householdId,
        amount: expense.amount,
        category_id: expense.categoryId || null,
        category_name: expense.categoryName,
        user_id: null,
        user_name: expense.userName,
        date: expense.date,
        notes: expense.notes || null,
        needs_or_wants: expense.needsOrWants,
        created_by: null,
      })
      .select('*')
      .single()
  );
  return toExpense(row);
}

export async function updateExpenseRow(expenseId: string, updates: Partial<Expense>): Promise<Expense> {
  const row = await throwIfError(
    await createClient()
      .from('expenses')
      .update({
        amount: updates.amount,
        category_id: updates.categoryId || undefined,
        category_name: updates.categoryName,
        user_name: updates.userName,
        date: updates.date,
        notes: updates.notes ?? null,
        needs_or_wants: updates.needsOrWants,
      })
      .eq('id', expenseId)
      .select('*')
      .single()
  );
  return toExpense(row);
}

export async function deleteExpenseRow(expenseId: string): Promise<void> {
  await throwIfError(await createClient().from('expenses').delete().eq('id', expenseId));
}

export async function insertIncomeSource(source: Omit<IncomeSource, 'id' | 'createdAt'>, data: BudgetStorageSchema): Promise<IncomeSource> {
  const householdId = requireHouseholdId(data);
  const row = await throwIfError(
    await createClient()
      .from('income_sources')
      .insert({ household_id: householdId, name: source.name, description: source.description || null } as any)
      .select('*')
      .single()
  );
  return toIncomeSource(row);
}

export async function updateIncomeSourceRow(sourceId: string, updates: Partial<IncomeSource>): Promise<IncomeSource> {
  const row = await throwIfError(
    await createClient()
      .from('income_sources')
      .update({ name: updates.name, description: updates.description ?? null } as any)
      .eq('id', sourceId)
      .select('*')
      .single()
  );
  return toIncomeSource(row);
}

export async function deleteIncomeSourceRow(sourceId: string): Promise<void> {
  await throwIfError(await createClient().from('income_sources').delete().eq('id', sourceId));
}

export async function insertBudgetMember(user: Omit<User, 'id' | 'createdAt'>, data: BudgetStorageSchema): Promise<User> {
  const householdId = requireHouseholdId(data);
  const row = await throwIfError(
    await createClient()
      .from('budget_members' as any)
      .insert({ household_id: householdId, name: user.name, email: user.email, role: user.role } as any)
      .select('*')
      .single()
  );
  return toUser(row);
}

export async function createHouseholdInvite(
  user: Omit<User, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): Promise<MemberInviteResult> {
  requireHouseholdId(data);
  const row = await throwIfError(
    await (createClient() as any)
      .rpc('create_household_invite', {
        member_name: user.name,
        member_email: user.email,
        member_role: user.role,
      })
      .single()
  ) as {
    member_id: string;
    household_id: string;
    name: string;
    email: string;
    role: 'primary' | 'member';
    created_at: string;
    invite_token: string;
    invite_expires_at: string;
  };

  const inviteToken = row.invite_token;
  return {
    member: {
      id: row.member_id,
      householdId: row.household_id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
    },
    inviteToken,
    inviteUrl: `${window.location.origin}/invite/${inviteToken}`,
    expiresAt: row.invite_expires_at,
  };
}

export async function updateBudgetMember(userId: string, updates: Partial<User>): Promise<User> {
  const row = await throwIfError(
    await createClient()
      .from('budget_members' as any)
      .update({ name: updates.name, email: updates.email, role: updates.role } as any)
      .eq('id', userId)
      .select('*')
      .single()
  );
  return toUser(row);
}

export async function deleteBudgetMember(userId: string): Promise<void> {
  await throwIfError(await createClient().from('budget_members' as any).delete().eq('id', userId));
}

export async function updateHouseholdRow(household: Household): Promise<Household> {
  const row = await throwIfError(
    await createClient()
      .from('households')
      .update({ name: household.name, currency: household.currency, updated_at: new Date().toISOString() })
      .eq('id', household.id)
      .select('*')
      .single()
  );
  return toHousehold(row);
}

export async function updateCategoryRow(categoryId: string, updates: Partial<Category>): Promise<Category> {
  const row = await throwIfError(
    await createClient()
      .from('categories')
      .update({
        name: updates.name,
        color: updates.color,
        monthly_budget: updates.monthlyBudget,
        carry_over_enabled: updates.carryOverEnabled,
        icon: updates.icon,
      } as any)
      .eq('id', categoryId)
      .select('*')
      .single()
  );
  return toCategory(row);
}

export async function updateMonthlyCategoryRow(monthlyCategoryId: string, updates: Partial<MonthlyCategory>): Promise<MonthlyCategory> {
  const supabase = createClient();
  const row = await throwIfError(
    await supabase
      .from('monthly_categories')
      .update({
        budget: updates.monthlyBudget,
        current_spent: updates.currentSpent,
        carry_over_amount: updates.carryOverAmount,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', monthlyCategoryId)
      .select('*')
      .single()
  );
  if (!row) throw new Error('Monthly budget was not updated');

  const categories = await throwIfError(
    await supabase.from('categories').select('*').eq('id', row.category_id)
  );
  return toMonthlyCategory(row, (categories || []).map(toCategory));
}

export async function createMonthlyBudgets(
  month: string,
  categories: Category[],
  carryOverAmounts: Record<string, number>,
  data: BudgetStorageSchema
): Promise<MonthlyCategory[]> {
  const householdId = requireHouseholdId(data);
  const rows = await throwIfError(
    await createClient()
      .from('monthly_categories')
      .insert(
        categories.map((category) => ({
          household_id: householdId,
          category_id: category.id,
          month,
          budget: category.monthlyBudget,
          current_spent: 0,
          carry_over_amount: carryOverAmounts[category.id] || 0,
        })) as any
      )
      .select('*')
  );
  return (rows || []).map((row: any) => toMonthlyCategory(row, categories));
}

export async function insertAlert(alert: Omit<Alert, 'id' | 'createdAt'>, data: BudgetStorageSchema): Promise<Alert> {
  const householdId = requireHouseholdId(data);
  const row = await throwIfError(
    await createClient()
      .from('alerts')
      .insert({
        household_id: householdId,
        type: alert.type,
        category_id: alert.categoryId || null,
        threshold: null,
        current_value: 0,
        severity: alert.severity,
        message: alert.message,
        dismissed: alert.dismissed,
      } as any)
      .select('*')
      .single()
  );
  return toAlert(row);
}

export async function dismissAlertRow(alertId: string): Promise<void> {
  await throwIfError(await createClient().from('alerts').update({ dismissed: true } as any).eq('id', alertId));
}
