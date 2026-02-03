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
} from '@/types';
import { getBudgetData, saveBudgetData, BudgetStorageSchema } from '@/lib/storage/budgetStorage';
import * as budgetStorage from '@/lib/storage/budgetStorage';
import { calculateBudgetSummary, calculateCategorySpending, calculateIncomeBreakdown } from '@/lib/calculations/budgetCalculations';
import { checkAndCreateAlerts } from '@/lib/calculations/alertCalculations';
import { calculateCarryOvers, getPreviousMonth } from '@/lib/utils/monthUtils';

export interface BudgetContextType {
  // State
  household: Household | null;
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

  // Derived calculations
  budgetSummary: BudgetSummary;
  categorySpending: CategorySpending[];
  incomeBreakdown: IncomeBreakdown[];
  activeAlerts: Alert[];

  // Actions
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

  // Loading state
  isLoading: boolean;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BudgetStorageSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data from localStorage
  useEffect(() => {
    const initialData = getBudgetData();
    setData(initialData);
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (data) {
      saveBudgetData(data);
    }
  }, [data]);

  const budgetSummary = useMemo(() => {
    if (!data) {
      return {
        totalIncome: 0,
        totalBudgeted: 0,
        totalSpent: 0,
        remaining: 0,
        netDisposableIncome: 0,
        savingsBalance: 0,
      };
    }

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

  // Check for new alerts after calculations
  useEffect(() => {
    if (!data || !data.onboardingCompleted) return;

    const newAlerts = checkAndCreateAlerts(categorySpending, budgetSummary, data.alerts);
    if (newAlerts.length > 0) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              alerts: [...prev.alerts, ...newAlerts],
            }
          : prev
      );
    }
  }, [categorySpending, budgetSummary, data?.alerts, data?.onboardingCompleted]);

  const addIncome = useCallback((income: Omit<Income, 'id' | 'createdAt'>) => {
    setData((prev) => (prev ? budgetStorage.addIncome(income, prev) : prev));
  }, []);

  const updateIncome = useCallback((incomeId: string, updates: Partial<Income>) => {
    setData((prev) => (prev ? budgetStorage.updateIncome(incomeId, updates, prev) : prev));
  }, []);

  const deleteIncome = useCallback((incomeId: string) => {
    setData((prev) => (prev ? budgetStorage.deleteIncome(incomeId, prev) : prev));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    setData((prev) => (prev ? budgetStorage.addExpense(expense, prev) : prev));
  }, []);

  const updateExpense = useCallback((expenseId: string, updates: Partial<Expense>) => {
    setData((prev) => (prev ? budgetStorage.updateExpense(expenseId, updates, prev) : prev));
  }, []);

  const deleteExpense = useCallback((expenseId: string) => {
    setData((prev) => (prev ? budgetStorage.deleteExpense(expenseId, prev) : prev));
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt'>) => {
    setData((prev) => (prev ? budgetStorage.addCategory(category, prev) : prev));
  }, []);

  const updateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    setData((prev) => (prev ? budgetStorage.updateCategory(categoryId, updates, prev) : prev));
  }, []);

  const updateMonthlyCategory = useCallback((monthlyCategoryId: string, updates: Partial<MonthlyCategory>) => {
    setData((prev) => (prev ? budgetStorage.updateMonthlyCategory(monthlyCategoryId, updates, prev) : prev));
  }, []);

  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    setData((prev) => (prev ? budgetStorage.addSavingsGoal(goal, prev) : prev));
  }, []);

  const addSavingsContribution = useCallback((contribution: Omit<SavingsContribution, 'id' | 'createdAt'>) => {
    setData((prev) => (prev ? budgetStorage.addSavingsContribution(contribution, prev) : prev));
  }, []);

  const addIncomeSource = useCallback((source: Omit<IncomeSource, 'id' | 'createdAt'>) => {
    setData((prev) => (prev ? budgetStorage.addIncomeSource(source, prev) : prev));
  }, []);

  const updateIncomeSource = useCallback((sourceId: string, updates: Partial<IncomeSource>) => {
    setData((prev) => (prev ? budgetStorage.updateIncomeSource(sourceId, updates, prev) : prev));
  }, []);

  const deleteIncomeSource = useCallback((sourceId: string) => {
    setData((prev) => (prev ? budgetStorage.deleteIncomeSource(sourceId, prev) : prev));
  }, []);

  const setHouseholdData = useCallback((household: Household) => {
    setData((prev) => (prev ? budgetStorage.setHousehold(household, prev) : prev));
  }, []);

  const addUserData = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    setData((prev) => (prev ? budgetStorage.addUser(user, prev) : prev));
  }, []);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setData((prev) => (prev ? budgetStorage.updateUser(userId, updates, prev) : prev));
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setData((prev) => (prev ? budgetStorage.deleteUser(userId, prev) : prev));
  }, []);

  const completeOnboarding = useCallback(
    (
      household: Household,
      users: User[],
      incomeSources: IncomeSource[],
      categories: Category[]
    ) => {
      console.log('BudgetContext completeOnboarding called with:', {
        household,
        users,
        incomeSources,
        categories,
      });

      setData((prev) => {
        if (!prev) {
          console.error('No previous data in context');
          return prev;
        }

        try {
          // Create monthly categories for current month
          const monthlyCategories = categories.map((cat) => ({
            id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
            categoryId: cat.id,
            categoryName: cat.name,
            monthlyBudget: cat.monthlyBudget,
            currentSpent: 0,
            carryOverAmount: 0,
            month: prev.currentMonth,
            createdAt: new Date().toISOString(),
          }));

          const result: BudgetStorageSchema = {
            ...prev,
            household,
            users,
            incomeSources,
            categories,
            monthlyCategories: [...prev.monthlyCategories, ...monthlyCategories],
            onboardingCompleted: true,
          };

          console.log('Onboarding complete, setting data:', result);
          return result;
        } catch (error) {
          console.error('Error in completeOnboarding:', error);
          return prev;
        }
      });
    },
    []
  );

  const dismissAlert = useCallback((alertId: string) => {
    setData((prev) => (prev ? budgetStorage.dismissAlert(alertId, prev) : prev));
  }, []);

  const setCurrentMonthData = useCallback((month: string) => {
    setData((prev) => (prev ? { ...prev, currentMonth: month } : prev));
  }, []);

  const createMonthlyBudgets = useCallback((month: string) => {
    setData((prev) => {
      if (!prev) return prev;

      const previousMonth = getPreviousMonth(month);
      const carryOvers = calculateCarryOvers(
        previousMonth,
        prev.monthlyCategories,
        prev.expenses,
        prev.categories
      );

      return budgetStorage.createMonthlyBudgetsFromTemplates(
        month,
        prev.categories,
        carryOvers,
        prev
      );
    });
  }, []);

  if (!data || isLoading) {
    return <div>Loading...</div>;
  }

  const value: BudgetContextType = {
    household: data.household,
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
    updateUser,
    deleteUser,
    completeOnboarding,
    dismissAlert,
    setCurrentMonth: setCurrentMonthData,
    createMonthlyBudgets,
    isLoading: false,
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
