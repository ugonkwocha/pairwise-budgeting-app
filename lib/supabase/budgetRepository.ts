'use client';

import { createClient } from '@/lib/supabase/client';
import { INITIAL_STORAGE } from '@/lib/storage/schema';
import { getCurrentLocalMonth } from '@/lib/utils/dateUtils';
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
  HouseholdInvite,
  RecurringTransaction,
  RecurringFrequency,
} from '@/types';

function freshInitialStorage(): BudgetStorageSchema {
  return {
    ...INITIAL_STORAGE,
    currentMonth: getCurrentLocalMonth(),
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

function toHouseholdInvite(row: any): HouseholdInvite {
  return {
    id: row.id,
    householdId: row.household_id,
    budgetMemberId: row.budget_member_id || undefined,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at || undefined,
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
    userId: row.budget_member_id || row.user_id || '',
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
    userId: row.budget_member_id || row.user_id || '',
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
  const user = users.find((member) => member.id === row.budget_member_id) || users[0];
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: Number(row.amount || 0),
    userId: user?.id || '',
    userName: user?.name || 'Household',
    date: row.date,
    notes: row.notes || undefined,
    createdAt: row.created_at,
  };
}

function toRecurringTransaction(row: any): RecurringTransaction {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    amount: Number(row.amount || 0),
    sourceId: row.source_id || undefined,
    sourceName: row.source_name || undefined,
    categoryId: row.category_id || undefined,
    categoryName: row.category_name || undefined,
    needsOrWants: row.needs_or_wants || undefined,
    userId: row.budget_member_id || '',
    userName: row.user_name,
    frequency: row.frequency,
    startDate: row.start_date,
    nextDueDate: row.next_due_date,
    endDate: row.end_date || undefined,
    notes: row.notes || undefined,
    autoPost: Boolean(row.auto_post),
    isActive: Boolean(row.is_active),
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export function getNextRecurringDueDate(date: string, frequency: RecurringFrequency): string {
  const [year, month, day] = date.split('-').map(Number);
  let next = new Date(year, month - 1, day);

  if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
  } else if (frequency === 'biweekly') {
    next.setDate(next.getDate() + 14);
  } else if (frequency === 'monthly') {
    next = addMonthsClamped(next, 1);
  } else if (frequency === 'quarterly') {
    next = addMonthsClamped(next, 3);
  } else {
    next = addMonthsClamped(next, 12);
  }

  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
}

async function throwIfError<T>(result: { data: T; error: any }): Promise<T> {
  if (result.error) throw result.error;
  return result.data;
}

export async function loadBudgetData(): Promise<{
  data: BudgetStorageSchema;
  isAuthenticated: boolean;
  accessStatus: 'ready' | 'needs_onboarding' | 'removed';
  removedHouseholdName?: string;
}> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: freshInitialStorage(), isAuthenticated: false, accessStatus: 'needs_onboarding' };
  }

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  } as any);

  const accessRows = await throwIfError(
    await (supabase as any).rpc('get_my_household_access_status')
  ) as Array<{
    household_id: string | null;
    household_name: string | null;
    status: 'active' | 'invited' | 'removed' | null;
    role: 'primary' | 'member' | null;
  }>;

  const access = accessRows?.[0];
  const householdId = access?.status === 'active' ? access.household_id : null;
  if (!householdId) {
    return {
      data: freshInitialStorage(),
      isAuthenticated: true,
      accessStatus: access?.status === 'removed' ? 'removed' : 'needs_onboarding',
      removedHouseholdName: access?.status === 'removed' ? access.household_name || undefined : undefined,
    };
  }

  const [household, members, invites, sources, categoryRows, incomes, expenses, goals, recurring, alerts] =
    await Promise.all([
      throwIfError(await supabase.from('households').select('*').eq('id', householdId).single()),
      throwIfError(await supabase.from('budget_members' as any).select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('invites' as any).select('*').eq('household_id', householdId).order('created_at', { ascending: false })),
      throwIfError(await supabase.from('income_sources').select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('categories').select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('incomes').select('*').eq('household_id', householdId).order('date', { ascending: false })),
      throwIfError(await supabase.from('expenses').select('*').eq('household_id', householdId).order('date', { ascending: false })),
      throwIfError(await supabase.from('savings_goals').select('*').eq('household_id', householdId).order('created_at')),
      throwIfError(await supabase.from('recurring_transactions' as any).select('*').eq('household_id', householdId).order('next_due_date')),
      throwIfError(await supabase.from('alerts').select('*').eq('household_id', householdId).order('created_at', { ascending: false })),
    ]);

  const categories = (categoryRows || []).map(toCategory);
  const monthlyRows = await throwIfError(
    await supabase.from('monthly_categories').select('*').eq('household_id', householdId).order('month')
  );
  const memberRows = (members || []) as any[];
  const users = memberRows.map(toUser);
  const currentUser =
    users.find((member) => {
      const source = memberRows.find((row) => row.id === member.id);
      return source?.auth_user_id === user.id;
    }) ||
    users.find((member) => member.email.toLowerCase() === (user.email || '').toLowerCase()) ||
    null;
  const contributions = await throwIfError(
    await supabase.from('savings_contributions').select('*').eq('household_id', householdId).order('date', { ascending: false })
  );

  return {
    isAuthenticated: true,
    accessStatus: 'ready',
    data: {
      ...freshInitialStorage(),
      household: toHousehold(household),
      currentUser,
      users,
      householdInvites: (invites || []).map(toHouseholdInvite),
      incomeSources: (sources || []).map(toIncomeSource),
      incomes: (incomes || []).map(toIncome),
      categories,
      monthlyCategories: (monthlyRows || []).map((row: any) => toMonthlyCategory(row, categories)),
      expenses: (expenses || []).map(toExpense),
      savingsGoals: (goals || []).map(toSavingsGoal),
      savingsContributions: (contributions || []).map((row: any) => toSavingsContribution(row, users)),
      recurringTransactions: (recurring || []).map(toRecurringTransaction),
      alerts: (alerts || []).map(toAlert),
      onboardingCompleted: true,
    },
  };
}

export async function hasActiveHouseholdAccess(householdId: string): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  const memberships = await throwIfError(
    await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
  );

  return Boolean(memberships?.[0]);
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = await throwIfError(
    await supabase
      .from('incomes')
      .insert({
        household_id: householdId,
        amount: income.amount,
        source_id: income.sourceId || null,
        source_name: income.sourceName,
        budget_member_id: income.userId || null,
        user_id: null,
        user_name: income.userName,
        date: income.date,
        notes: income.notes || null,
        created_by: user?.id || null,
      } as any)
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
        budget_member_id: updates.userId || undefined,
        user_name: updates.userName,
        date: updates.date,
        notes: updates.notes ?? null,
      } as any)
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
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = await throwIfError(
    await supabase
      .from('expenses')
      .insert({
        household_id: householdId,
        amount: expense.amount,
        category_id: expense.categoryId || null,
        category_name: expense.categoryName,
        budget_member_id: expense.userId || null,
        user_id: null,
        user_name: expense.userName,
        date: expense.date,
        notes: expense.notes || null,
        needs_or_wants: expense.needsOrWants,
        created_by: user?.id || null,
      } as any)
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
        budget_member_id: updates.userId || undefined,
        user_name: updates.userName,
        date: updates.date,
        notes: updates.notes ?? null,
        needs_or_wants: updates.needsOrWants,
      } as any)
      .eq('id', expenseId)
      .select('*')
      .single()
  );
  return toExpense(row);
}

export async function deleteExpenseRow(expenseId: string): Promise<void> {
  await throwIfError(await createClient().from('expenses').delete().eq('id', expenseId));
}

export async function insertSavingsGoal(
  goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>,
  data: BudgetStorageSchema
): Promise<SavingsGoal> {
  const householdId = requireHouseholdId(data);
  const row = await throwIfError(
    await createClient()
      .from('savings_goals')
      .insert({
        household_id: householdId,
        name: goal.name,
        target_amount: goal.targetAmount,
        current_amount: goal.currentAmount,
        starting_amount: goal.currentAmount,
        deadline: goal.deadline || null,
      } as any)
      .select('*')
      .single()
  );
  return toSavingsGoal(row);
}

export async function updateSavingsGoalRow(goalId: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
  const supabase = createClient();
  const patch: Record<string, unknown> = {
    name: updates.name,
    target_amount: updates.targetAmount,
    deadline: updates.deadline ?? null,
    updated_at: new Date().toISOString(),
  };

  if (typeof updates.currentAmount === 'number') {
    const contributions = await throwIfError(
      await supabase.from('savings_contributions').select('amount').eq('goal_id', goalId)
    );
    const contributionTotal = (contributions || []).reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0);
    patch.current_amount = updates.currentAmount;
    patch.starting_amount = Math.max(updates.currentAmount - contributionTotal, 0);
  }

  const row = await throwIfError(
    await supabase
      .from('savings_goals')
      .update(patch as any)
      .eq('id', goalId)
      .select('*')
      .single()
  );
  return toSavingsGoal(row);
}

export async function deleteSavingsGoalRow(goalId: string): Promise<void> {
  await throwIfError(await createClient().from('savings_goals').delete().eq('id', goalId));
}

export async function insertSavingsContribution(
  contribution: Omit<SavingsContribution, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): Promise<{ contribution: SavingsContribution; goal: SavingsGoal }> {
  const householdId = requireHouseholdId(data);
  const supabase = createClient();
  const row = await throwIfError(
    await supabase
      .from('savings_contributions')
      .insert({
        household_id: householdId,
        goal_id: contribution.goalId,
        amount: contribution.amount,
        budget_member_id: contribution.userId || null,
        date: contribution.date,
        notes: contribution.notes || null,
      } as any)
      .select('*')
      .single()
  );

  const goalRow = await throwIfError(
    await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', contribution.goalId)
      .single()
  );

  return {
    contribution: toSavingsContribution(row, data.users),
    goal: toSavingsGoal(goalRow),
  };
}

export async function deleteSavingsContributionRow(contribution: SavingsContribution): Promise<SavingsGoal> {
  const supabase = createClient();
  await throwIfError(await supabase.from('savings_contributions').delete().eq('id', contribution.id));

  const row = await throwIfError(
    await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', contribution.goalId)
      .single()
  );
  return toSavingsGoal(row);
}

export async function insertRecurringTransaction(
  recurring: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>,
  data: BudgetStorageSchema
): Promise<RecurringTransaction> {
  const householdId = requireHouseholdId(data);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const row = await throwIfError(
    await (supabase as any)
      .from('recurring_transactions')
      .insert({
        household_id: householdId,
        type: recurring.type,
        name: recurring.name,
        amount: recurring.amount,
        source_id: recurring.type === 'income' ? recurring.sourceId || null : null,
        source_name: recurring.type === 'income' ? recurring.sourceName || null : null,
        category_id: recurring.type === 'expense' ? recurring.categoryId || null : null,
        category_name: recurring.type === 'expense' ? recurring.categoryName || null : null,
        needs_or_wants: recurring.type === 'expense' ? recurring.needsOrWants || 'needs' : null,
        budget_member_id: recurring.userId || null,
        user_name: recurring.userName,
        frequency: recurring.frequency,
        start_date: recurring.startDate,
        next_due_date: recurring.nextDueDate,
        end_date: recurring.endDate || null,
        notes: recurring.notes || null,
        auto_post: recurring.autoPost,
        is_active: recurring.isActive,
        created_by: user?.id || null,
      })
      .select('*')
      .single()
  );
  return toRecurringTransaction(row);
}

export async function updateRecurringTransactionRow(
  recurringId: string,
  updates: Partial<RecurringTransaction>
): Promise<RecurringTransaction> {
  const row = await throwIfError(
    await (createClient() as any)
      .from('recurring_transactions')
      .update({
        type: updates.type,
        name: updates.name,
        amount: updates.amount,
        source_id: updates.type === 'expense' ? null : updates.sourceId,
        source_name: updates.type === 'expense' ? null : updates.sourceName,
        category_id: updates.type === 'income' ? null : updates.categoryId,
        category_name: updates.type === 'income' ? null : updates.categoryName,
        needs_or_wants: updates.type === 'income' ? null : updates.needsOrWants,
        budget_member_id: updates.userId,
        user_name: updates.userName,
        frequency: updates.frequency,
        start_date: updates.startDate,
        next_due_date: updates.nextDueDate,
        end_date: updates.endDate ?? null,
        notes: updates.notes ?? null,
        auto_post: updates.autoPost,
        is_active: updates.isActive,
      })
      .eq('id', recurringId)
      .select('*')
      .single()
  );
  return toRecurringTransaction(row);
}

export async function deleteRecurringTransactionRow(recurringId: string): Promise<void> {
  await throwIfError(await (createClient() as any).from('recurring_transactions').delete().eq('id', recurringId));
}

export async function postRecurringTransaction(
  recurring: RecurringTransaction,
  data: BudgetStorageSchema
): Promise<{ recurring: RecurringTransaction; income?: Income; expense?: Expense }> {
  if (!recurring.isActive) {
    throw new Error('This recurring item is inactive');
  }

  const nextDueDate = getNextRecurringDueDate(recurring.nextDueDate, recurring.frequency);
  const shouldRemainActive = !recurring.endDate || nextDueDate <= recurring.endDate;

  const posted = recurring.type === 'income'
    ? await insertIncome({
        amount: recurring.amount,
        sourceId: recurring.sourceId || '',
        sourceName: recurring.sourceName || recurring.name,
        userId: recurring.userId,
        userName: recurring.userName,
        date: recurring.nextDueDate,
        notes: recurring.notes ? `${recurring.name}: ${recurring.notes}` : recurring.name,
        createdBy: recurring.createdBy || recurring.userId,
      }, data)
    : await insertExpense({
        amount: recurring.amount,
        categoryId: recurring.categoryId || '',
        categoryName: recurring.categoryName || recurring.name,
        needsOrWants: recurring.needsOrWants || 'needs',
        userId: recurring.userId,
        userName: recurring.userName,
        date: recurring.nextDueDate,
        notes: recurring.notes ? `${recurring.name}: ${recurring.notes}` : recurring.name,
        createdBy: recurring.createdBy || recurring.userId,
      }, data);

  const updated = await updateRecurringTransactionRow(recurring.id, {
    ...recurring,
    nextDueDate,
    isActive: shouldRemainActive,
  });

  return recurring.type === 'income'
    ? { recurring: updated, income: posted as Income }
    : { recurring: updated, expense: posted as Expense };
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
  const supabase = createClient();
  const row = await throwIfError(
    await supabase
      .from('income_sources')
      .update({ name: updates.name, description: updates.description ?? null } as any)
      .eq('id', sourceId)
      .select('*')
      .single()
  );
  if (!row) throw new Error('Income source was not updated');
  if (updates.name) {
    await throwIfError(
      await supabase
        .from('incomes')
        .update({ source_name: row.name } as any)
        .eq('source_id', sourceId)
    );
    await throwIfError(
      await (supabase as any)
        .from('recurring_transactions')
        .update({ source_name: row.name })
        .eq('source_id', sourceId)
    );
  }
  return toIncomeSource(row);
}

export async function deleteIncomeSourceRow(sourceId: string): Promise<void> {
  await throwIfError(await createClient().from('income_sources').delete().eq('id', sourceId));
}

export async function insertCategory(category: Omit<Category, 'id' | 'createdAt'>, data: BudgetStorageSchema): Promise<{
  category: Category;
  monthlyCategory: MonthlyCategory | null;
}> {
  const householdId = requireHouseholdId(data);
  const supabase = createClient();
  const row = await throwIfError(
    await supabase
      .from('categories')
      .insert({
        household_id: householdId,
        name: category.name,
        monthly_budget: category.monthlyBudget,
        carry_over_enabled: category.carryOverEnabled,
        needs_or_wants: 'needs',
        icon: category.icon || null,
        color: category.color || null,
      } as any)
      .select('*')
      .single()
  );
  const createdCategory = toCategory(row);

  const monthlyRow = await throwIfError(
    await supabase
      .from('monthly_categories')
      .insert({
        household_id: householdId,
        category_id: createdCategory.id,
        month: data.currentMonth,
        budget: createdCategory.monthlyBudget,
        current_spent: 0,
        carry_over_amount: 0,
      } as any)
      .select('*')
      .single()
  );

  return {
    category: createdCategory,
    monthlyCategory: monthlyRow ? toMonthlyCategory(monthlyRow, [createdCategory]) : null,
  };
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
    invite_id: string;
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
  const invite: HouseholdInvite = {
    id: row.invite_id,
    householdId: row.household_id,
    budgetMemberId: row.member_id,
    email: row.email,
    role: row.role,
    token: inviteToken,
    expiresAt: row.invite_expires_at,
    createdAt: new Date().toISOString(),
  };

  return {
    member: {
      id: row.member_id,
      householdId: row.household_id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at,
    },
    invite,
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
  await throwIfError(await (createClient() as any).rpc('remove_budget_member', { target_budget_member_id: userId }));
}

export async function deleteHouseholdInvite(inviteId: string): Promise<void> {
  await throwIfError(await (createClient() as any).rpc('delete_household_invite', { target_invite_id: inviteId }));
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
  const supabase = createClient();
  const row = await throwIfError(
    await supabase
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
  if (!row) throw new Error('Category was not updated');
  if (updates.name) {
    await throwIfError(
      await supabase
        .from('expenses')
        .update({ category_name: row.name } as any)
        .eq('category_id', categoryId)
    );
    await throwIfError(
      await (supabase as any)
        .from('recurring_transactions')
        .update({ category_name: row.name })
        .eq('category_id', categoryId)
    );
  }
  return toCategory(row);
}

export async function deleteCategoryRow(categoryId: string): Promise<void> {
  await throwIfError(await createClient().from('categories').delete().eq('id', categoryId));
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
