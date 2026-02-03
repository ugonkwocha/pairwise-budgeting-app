'use client';

import { STORAGE_KEYS } from './constants';
import { INITIAL_STORAGE } from './schema';
import type { BudgetStorageSchema } from './schema';

export type { BudgetStorageSchema };
import {
  Household,
  User,
  Income,
  Expense,
  Category,
  SavingsGoal,
  SavingsContribution,
  IncomeSource,
  MonthlyCategory,
  Alert,
} from '@/types';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function safeGetItem(key: string): any | null {
  if (typeof window === 'undefined') return null;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return null;
  }
}

function safeSetItem(key: string, value: any): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if ((error as any).name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
    }
    console.error('Failed to write to localStorage:', error);
    return false;
  }
}

export function getBudgetData(): BudgetStorageSchema {
  const stored = safeGetItem(STORAGE_KEYS.BUDGET_DATA);

  if (stored) {
    return {
      ...INITIAL_STORAGE,
      ...stored,
    };
  }

  return INITIAL_STORAGE;
}

export function saveBudgetData(data: BudgetStorageSchema): boolean {
  return safeSetItem(STORAGE_KEYS.BUDGET_DATA, data);
}

export function addIncome(
  income: Omit<Income, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newIncome: Income = {
    ...income,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    incomes: [...data.incomes, newIncome],
  };
}

export function updateIncome(
  incomeId: string,
  updates: Partial<Income>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    incomes: data.incomes.map((i) =>
      i.id === incomeId
        ? {
            ...i,
            ...updates,
          }
        : i
    ),
  };
}

export function deleteIncome(
  incomeId: string,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    incomes: data.incomes.filter((i) => i.id !== incomeId),
  };
}

export function addExpense(
  expense: Omit<Expense, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newExpense: Expense = {
    ...expense,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    expenses: [...data.expenses, newExpense],
  };
}

export function updateExpense(
  expenseId: string,
  updates: Partial<Expense>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    expenses: data.expenses.map((e) =>
      e.id === expenseId
        ? {
            ...e,
            ...updates,
          }
        : e
    ),
  };
}

export function deleteExpense(
  expenseId: string,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    expenses: data.expenses.filter((e) => e.id !== expenseId),
  };
}

export function addCategory(
  category: Omit<Category, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newCategory: Category = {
    ...category,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    categories: [...data.categories, newCategory],
  };
}

export function updateCategory(
  categoryId: string,
  updates: Partial<Category>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    categories: data.categories.map((c) =>
      c.id === categoryId
        ? {
            ...c,
            ...updates,
          }
        : c
    ),
  };
}

export function addSavingsGoal(
  goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newGoal: SavingsGoal = {
    ...goal,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    ...data,
    savingsGoals: [...data.savingsGoals, newGoal],
  };
}

export function addSavingsContribution(
  contribution: Omit<SavingsContribution, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newContribution: SavingsContribution = {
    ...contribution,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  // Update the goal's current amount
  const updatedGoals = data.savingsGoals.map((g) =>
    g.id === contribution.goalId
      ? {
          ...g,
          currentAmount: g.currentAmount + contribution.amount,
          updatedAt: new Date().toISOString(),
        }
      : g
  );

  return {
    ...data,
    savingsContributions: [...data.savingsContributions, newContribution],
    savingsGoals: updatedGoals,
  };
}

export function addAlert(
  alert: Omit<Alert, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  // Check if alert already exists (avoid duplicates)
  const alertExists = data.alerts.some(
    (a) => a.type === alert.type && a.categoryId === alert.categoryId && !a.dismissed
  );

  if (alertExists) {
    return data;
  }

  const newAlert: Alert = {
    ...alert,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    alerts: [...data.alerts, newAlert],
  };
}

export function dismissAlert(
  alertId: string,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    alerts: data.alerts.map((a) =>
      a.id === alertId
        ? {
            ...a,
            dismissed: true,
          }
        : a
    ),
  };
}

export function setHousehold(
  household: Household,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    household: {
      ...household,
      updatedAt: new Date().toISOString(),
    },
  };
}

export function addUser(
  user: Omit<User, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    users: [...data.users, newUser],
  };
}

export function updateUser(
  userId: string,
  updates: Partial<User>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    users: data.users.map((u) =>
      u.id === userId
        ? {
            ...u,
            ...updates,
          }
        : u
    ),
  };
}

export function deleteUser(
  userId: string,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    users: data.users.filter((u) => u.id !== userId),
  };
}

export function addIncomeSource(
  source: Omit<IncomeSource, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newSource: IncomeSource = {
    ...source,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    incomeSources: [...data.incomeSources, newSource],
  };
}

export function updateIncomeSource(
  sourceId: string,
  updates: Partial<IncomeSource>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    incomeSources: data.incomeSources.map((s) =>
      s.id === sourceId
        ? {
            ...s,
            ...updates,
          }
        : s
    ),
  };
}

export function deleteIncomeSource(
  sourceId: string,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    incomeSources: data.incomeSources.filter((s) => s.id !== sourceId),
  };
}

export function addMonthlyCategory(
  monthlyCategory: Omit<MonthlyCategory, 'id' | 'createdAt'>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newMonthlyCategory: MonthlyCategory = {
    ...monthlyCategory,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  return {
    ...data,
    monthlyCategories: [...data.monthlyCategories, newMonthlyCategory],
  };
}

export function updateMonthlyCategory(
  monthlyCategoryId: string,
  updates: Partial<MonthlyCategory>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    monthlyCategories: data.monthlyCategories.map((mc) =>
      mc.id === monthlyCategoryId
        ? {
            ...mc,
            ...updates,
          }
        : mc
    ),
  };
}

export function createMonthlyBudgetsFromTemplates(
  month: string,
  categories: Category[],
  carryOverAmounts: Record<string, number>,
  data: BudgetStorageSchema
): BudgetStorageSchema {
  const newMonthlyCategories = categories.map((category) => {
    const monthlyCategory: MonthlyCategory = {
      id: generateId(),
      categoryId: category.id,
      categoryName: category.name,
      monthlyBudget: category.monthlyBudget,
      currentSpent: 0,
      carryOverAmount: carryOverAmounts[category.id] || 0,
      month: month,
      createdAt: new Date().toISOString(),
    };
    return monthlyCategory;
  });

  return {
    ...data,
    monthlyCategories: [...data.monthlyCategories, ...newMonthlyCategories],
  };
}

export function completeOnboarding(
  data: BudgetStorageSchema
): BudgetStorageSchema {
  return {
    ...data,
    onboardingCompleted: true,
  };
}

export function getMonthlyData(
  month: string,
  data: BudgetStorageSchema
): {
  incomes: Income[];
  expenses: Expense[];
  categories: MonthlyCategory[];
} {
  const monthIncomes = data.incomes.filter((i) => i.date.startsWith(month));
  const monthExpenses = data.expenses.filter((e) => e.date.startsWith(month));
  const monthCategories = data.monthlyCategories.filter((c) => c.month === month);

  return {
    incomes: monthIncomes,
    expenses: monthExpenses,
    categories: monthCategories,
  };
}

export function exportData(
  filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    userId?: string;
  }
): { incomes: Income[]; expenses: Expense[] } {
  const data = getBudgetData();

  let incomes = [...data.incomes];
  let expenses = [...data.expenses];

  if (filters?.startDate) {
    incomes = incomes.filter((i) => i.date >= filters.startDate!);
    expenses = expenses.filter((e) => e.date >= filters.startDate!);
  }

  if (filters?.endDate) {
    incomes = incomes.filter((i) => i.date <= filters.endDate!);
    expenses = expenses.filter((e) => e.date <= filters.endDate!);
  }

  if (filters?.categoryId) {
    expenses = expenses.filter((e) => e.categoryId === filters.categoryId);
  }

  if (filters?.userId) {
    incomes = incomes.filter((i) => i.userId === filters.userId);
    expenses = expenses.filter((e) => e.userId === filters.userId);
  }

  return { incomes, expenses };
}
