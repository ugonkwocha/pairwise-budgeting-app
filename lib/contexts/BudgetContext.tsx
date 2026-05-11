'use client';

import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  Household,
  User,
  Income,
  Expense,
  Category,
  SavingsGoal,
  SavingsContribution,
  Alert,
  IncomeSource,
  MonthlyCategory,
  BudgetSummary,
  CategorySpending,
  IncomeBreakdown,
  MemberInviteResult,
} from '@/types';
import { BudgetStorageSchema } from '@/lib/storage/schema';
import { calculateBudgetSummary, calculateCategorySpending, calculateIncomeBreakdown } from '@/lib/calculations/budgetCalculations';
import { checkAndCreateAlerts } from '@/lib/calculations/alertCalculations';
import { calculateCarryOvers, getPreviousMonth } from '@/lib/utils/monthUtils';
import * as budgetRepository from '@/lib/supabase/budgetRepository';

export interface BudgetContextType {
  household: Household | null;
  currentUser: User | null;
  users: User[];
  categories: Category[];
  monthlyCategories: MonthlyCategory[];
  incomes: Income[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  incomeSources: IncomeSource[];
  alerts: Alert[];
  onboardingCompleted: boolean;
  currentMonth: string;
  isAuthenticated: boolean;
  budgetSummary: BudgetSummary;
  categorySpending: CategorySpending[];
  incomeBreakdown: IncomeBreakdown[];
  activeAlerts: Alert[];
  addIncome: (income: Omit<Income, 'id' | 'createdAt'>) => void;
  updateIncome: (incomeId: string, updates: Partial<Income>) => void;
  deleteIncome: (incomeId: string) => void;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  deleteExpense: (expenseId: string) => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (categoryId: string, updates: Partial<Category>) => void;
  updateMonthlyCategory: (monthlyCategoryId: string, updates: Partial<MonthlyCategory>) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addSavingsContribution: (contribution: Omit<SavingsContribution, 'id' | 'createdAt'>) => void;
  addIncomeSource: (source: Omit<IncomeSource, 'id' | 'createdAt'>) => void;
  updateIncomeSource: (sourceId: string, updates: Partial<IncomeSource>) => void;
  deleteIncomeSource: (sourceId: string) => void;
  setHousehold: (household: Household) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  inviteUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<MemberInviteResult>;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  completeOnboarding: (
    household: Household,
    users: User[],
    incomeSources: IncomeSource[],
    categories: Category[]
  ) => void;
  dismissAlert: (alertId: string) => void;
  setCurrentMonth: (month: string) => void;
  createMonthlyBudgets: (month: string) => void;
  reload: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

function emptySummary(): BudgetSummary {
  return {
    totalIncome: 0,
    totalBudgeted: 0,
    totalSpent: 0,
    remaining: 0,
    netDisposableIncome: 0,
    savingsBalance: 0,
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
    return (err as any).message;
  }
  return fallback;
}

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BudgetStorageSchema | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await budgetRepository.loadBudgetData();
      setData(result.data);
      setIsAuthenticated(result.isAuthenticated);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load budget data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const budgetSummary = useMemo(() => {
    if (!data) return emptySummary();
    return calculateBudgetSummary(data.incomes, data.expenses, data.monthlyCategories, data.savingsContributions, data.currentMonth);
  }, [data?.incomes, data?.expenses, data?.monthlyCategories, data?.savingsContributions, data?.currentMonth]);

  const categorySpending = useMemo(() => {
    if (!data) return [];
    return calculateCategorySpending(data.monthlyCategories, data.expenses, data.currentMonth);
  }, [data?.monthlyCategories, data?.expenses, data?.currentMonth]);

  const incomeBreakdown = useMemo(() => {
    if (!data) return [];
    return calculateIncomeBreakdown(data.incomes, data.currentMonth);
  }, [data?.incomes, data?.currentMonth]);

  const activeAlerts = useMemo(() => {
    return data?.alerts.filter((a) => !a.dismissed) || [];
  }, [data?.alerts]);

  useEffect(() => {
    if (!data?.onboardingCompleted || !data.household) return;

    const newAlerts = checkAndCreateAlerts(categorySpending, budgetSummary, data.alerts);
    newAlerts.forEach((alert) => {
      budgetRepository
        .insertAlert(
          {
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            categoryId: alert.categoryId,
            dismissed: false,
          },
          data
        )
        .then((created) => {
          setData((prev) => (prev ? { ...prev, alerts: [...prev.alerts, created] } : prev));
        })
        .catch((err) => setError(getErrorMessage(err, 'Unable to create alert')));
    });
  }, [categorySpending, budgetSummary, data?.alerts, data?.onboardingCompleted, data?.household]);

  const addIncome = useCallback((income: Omit<Income, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertIncome(income, data)
      .then((created) => setData((prev) => (prev ? { ...prev, incomes: [...prev.incomes, created] } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to add income')));
  }, [data]);

  const updateIncome = useCallback((incomeId: string, updates: Partial<Income>) => {
    budgetRepository.updateIncomeRow(incomeId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, incomes: prev.incomes.map((i) => i.id === incomeId ? updated : i) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to update income')));
  }, []);

  const deleteIncome = useCallback((incomeId: string) => {
    budgetRepository.deleteIncomeRow(incomeId)
      .then(() => setData((prev) => (prev ? { ...prev, incomes: prev.incomes.filter((i) => i.id !== incomeId) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to delete income')));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertExpense(expense, data)
      .then((created) => setData((prev) => (prev ? { ...prev, expenses: [...prev.expenses, created] } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to add expense')));
  }, [data]);

  const updateExpense = useCallback((expenseId: string, updates: Partial<Expense>) => {
    budgetRepository.updateExpenseRow(expenseId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, expenses: prev.expenses.map((e) => e.id === expenseId ? updated : e) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to update expense')));
  }, []);

  const deleteExpense = useCallback((expenseId: string) => {
    budgetRepository.deleteExpenseRow(expenseId)
      .then(() => setData((prev) => (prev ? { ...prev, expenses: prev.expenses.filter((e) => e.id !== expenseId) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to delete expense')));
  }, []);

  const addCategory = useCallback((_category: Omit<Category, 'id' | 'createdAt'>) => {
    setError('Adding categories after onboarding is not wired yet.');
  }, []);

  const updateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    budgetRepository.updateCategoryRow(categoryId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, categories: prev.categories.map((c) => c.id === categoryId ? updated : c) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to update category')));
  }, []);

  const updateMonthlyCategory = useCallback((monthlyCategoryId: string, updates: Partial<MonthlyCategory>) => {
    budgetRepository.updateMonthlyCategoryRow(monthlyCategoryId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, monthlyCategories: prev.monthlyCategories.map((mc) => mc.id === monthlyCategoryId ? updated : mc) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to update monthly budget')));
  }, []);

  const addSavingsGoal = useCallback((_goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    setError('Savings goals are not wired to Supabase yet.');
  }, []);

  const addSavingsContribution = useCallback((_contribution: Omit<SavingsContribution, 'id' | 'createdAt'>) => {
    setError('Savings contributions are not wired to Supabase yet.');
  }, []);

  const addIncomeSource = useCallback((source: Omit<IncomeSource, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertIncomeSource(source, data)
      .then((created) => setData((prev) => (prev ? { ...prev, incomeSources: [...prev.incomeSources, created] } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to add income source')));
  }, [data]);

  const updateIncomeSource = useCallback((sourceId: string, updates: Partial<IncomeSource>) => {
    budgetRepository.updateIncomeSourceRow(sourceId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, incomeSources: prev.incomeSources.map((s) => s.id === sourceId ? updated : s) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to update income source')));
  }, []);

  const deleteIncomeSource = useCallback((sourceId: string) => {
    budgetRepository.deleteIncomeSourceRow(sourceId)
      .then(() => setData((prev) => (prev ? { ...prev, incomeSources: prev.incomeSources.filter((s) => s.id !== sourceId) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to delete income source')));
  }, []);

  const setHouseholdData = useCallback((household: Household) => {
    budgetRepository.updateHouseholdRow(household)
      .then((updated) => setData((prev) => (prev ? { ...prev, household: updated } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to update household')));
  }, []);

  const addUserData = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertBudgetMember(user, data)
      .then((created) => setData((prev) => (prev ? { ...prev, users: [...prev.users, created] } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to add member')));
  }, [data]);

  const inviteUser = useCallback(async (user: Omit<User, 'id' | 'createdAt'>) => {
    if (!data) {
      throw new Error('No household is loaded');
    }

    try {
      const invite = await budgetRepository.createHouseholdInvite(user, data);
      setData((prev) => (prev ? { ...prev, users: [...prev.users, invite.member] } : prev));
      return invite;
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to invite member');
      setError(message);
      throw new Error(message);
    }
  }, [data]);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    budgetRepository.updateBudgetMember(userId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, users: prev.users.map((u) => u.id === userId ? updated : u) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to update member')));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    budgetRepository.deleteBudgetMember(userId)
      .then(() => setData((prev) => (prev ? { ...prev, users: prev.users.filter((u) => u.id !== userId) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to delete member')));
  }, []);

  const completeOnboarding = useCallback((
    household: Household,
    users: User[],
    incomeSources: IncomeSource[],
    categories: Category[]
  ) => {
    const month = data?.currentMonth || new Date().toISOString().slice(0, 7);
    budgetRepository.createHouseholdSetup(household, users, incomeSources, categories, month)
      .then((createdData) => setData(createdData))
      .catch((err) => setError(getErrorMessage(err, 'Unable to complete onboarding')));
  }, [data?.currentMonth]);

  const dismissAlert = useCallback((alertId: string) => {
    budgetRepository.dismissAlertRow(alertId)
      .then(() => setData((prev) => (prev ? { ...prev, alerts: prev.alerts.map((a) => a.id === alertId ? { ...a, dismissed: true } : a) } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to dismiss alert')));
  }, []);

  const setCurrentMonthData = useCallback((month: string) => {
    setData((prev) => (prev ? { ...prev, currentMonth: month } : prev));
  }, []);

  const createMonthlyBudgetsAction = useCallback((month: string) => {
    if (!data) return;

    const previousMonth = getPreviousMonth(month);
    const carryOvers = calculateCarryOvers(previousMonth, data.monthlyCategories, data.expenses, data.categories);

    budgetRepository.createMonthlyBudgets(month, data.categories, carryOvers, data)
      .then((created) => setData((prev) => (prev ? { ...prev, monthlyCategories: [...prev.monthlyCategories, ...created] } : prev)))
      .catch((err) => setError(getErrorMessage(err, 'Unable to create monthly budgets')));
  }, [data]);

  if (!data || isLoading) {
    return <div>Loading...</div>;
  }

  const value: BudgetContextType = {
    household: data.household,
    currentUser: data.currentUser,
    users: data.users,
    categories: data.categories,
    monthlyCategories: data.monthlyCategories,
    incomes: data.incomes,
    expenses: data.expenses,
    savingsGoals: data.savingsGoals,
    incomeSources: data.incomeSources,
    alerts: data.alerts,
    onboardingCompleted: data.onboardingCompleted,
    currentMonth: data.currentMonth,
    isAuthenticated,
    budgetSummary,
    categorySpending,
    incomeBreakdown,
    activeAlerts,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addCategory,
    updateCategory,
    updateMonthlyCategory,
    addSavingsGoal,
    addSavingsContribution,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    setHousehold: setHouseholdData,
    addUser: addUserData,
    inviteUser,
    updateUser,
    deleteUser,
    completeOnboarding,
    dismissAlert,
    setCurrentMonth: setCurrentMonthData,
    createMonthlyBudgets: createMonthlyBudgetsAction,
    reload,
    isLoading: false,
    error,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget(): BudgetContextType {
  const context = React.useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
}
