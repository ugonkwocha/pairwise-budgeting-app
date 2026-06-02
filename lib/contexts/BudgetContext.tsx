'use client';

import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  HouseholdInvite,
  RecurringTransaction,
  PostedRecurringTransactionResult,
} from '@/types';
import { BudgetStorageSchema } from '@/lib/storage/schema';
import { calculateBudgetSummary, calculateCategorySpending, calculateIncomeBreakdown } from '@/lib/calculations/budgetCalculations';
import { checkAndCreateAlerts, getCurrentAlertMessage, isAlertRelevant } from '@/lib/calculations/alertCalculations';
import { calculateCarryOvers, getPreviousMonth } from '@/lib/utils/monthUtils';
import { getCurrentLocalMonth } from '@/lib/utils/dateUtils';
import * as budgetRepository from '@/lib/supabase/budgetRepository';
import { INITIAL_STORAGE } from '@/lib/storage/schema';
import { AppLoadingScreen } from '@/components/system/AppLoadingScreen';
import { RemovedHouseholdScreen } from '@/components/system/RemovedHouseholdScreen';

export interface BudgetContextType {
  household: Household | null;
  currentUser: User | null;
  users: User[];
  householdInvites: HouseholdInvite[];
  categories: Category[];
  monthlyCategories: MonthlyCategory[];
  incomes: Income[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  recurringTransactions: RecurringTransaction[];
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
  deleteCategory: (categoryId: string) => void;
  updateMonthlyCategory: (monthlyCategoryId: string, updates: Partial<MonthlyCategory>) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSavingsGoal: (goalId: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (goalId: string) => void;
  addSavingsContribution: (contribution: Omit<SavingsContribution, 'id' | 'createdAt'>) => void;
  deleteSavingsContribution: (contributionId: string) => void;
  addRecurringTransaction: (recurring: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecurringTransaction: (recurringId: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurringTransaction: (recurringId: string) => void;
  postRecurringTransaction: (recurringId: string) => Promise<PostedRecurringTransactionResult | null>;
  addIncomeSource: (source: Omit<IncomeSource, 'id' | 'createdAt'>) => void;
  updateIncomeSource: (sourceId: string, updates: Partial<IncomeSource>) => void;
  deleteIncomeSource: (sourceId: string) => void;
  setHousehold: (household: Household) => void;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  inviteUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<MemberInviteResult>;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  deleteInvite: (inviteId: string) => void;
  completeOnboarding: (
    household: Household,
    users: User[],
    incomeSources: IncomeSource[],
    categories: Category[]
  ) => void;
  dismissAlert: (alertId: string) => void;
  setCurrentMonth: (month: string) => void;
  createMonthlyBudgets: (month: string, budgetOverrides?: Record<string, number>) => void;
  reload: () => Promise<void>;
  isLoading: boolean;
  accessStatus: 'loading' | 'ready' | 'needs_onboarding' | 'removed';
  error: string | null;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);
const START_NEW_HOUSEHOLD_KEY = 'pairwise:start-new-household';

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
  const pathname = usePathname();
  const router = useRouter();
  const [data, setData] = useState<BudgetStorageSchema | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessStatus, setAccessStatus] = useState<'loading' | 'ready' | 'needs_onboarding' | 'removed'>('loading');
  const [removedHouseholdName, setRemovedHouseholdName] = useState<string | undefined>();
  const [isStartingNewHousehold, setIsStartingNewHousehold] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsStartingNewHousehold(window.localStorage.getItem(START_NEW_HOUSEHOLD_KEY) === 'true');
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await budgetRepository.loadBudgetData();
      setData(result.data);
      setIsAuthenticated(result.isAuthenticated);
      setAccessStatus(result.accessStatus);
      setRemovedHouseholdName(result.removedHouseholdName);
      if (result.accessStatus === 'ready') {
        window.localStorage.removeItem(START_NEW_HOUSEHOLD_KEY);
        setIsStartingNewHousehold(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load budget data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!isAuthenticated || !data?.household?.id) return;

    let isMounted = true;
    const householdId = data.household.id;

    const verifyAccess = async () => {
      try {
        const hasAccess = await budgetRepository.hasActiveHouseholdAccess(householdId);
        if (isMounted && !hasAccess) {
          await reload();
        }
      } catch {
        // Normal data reads will surface any actionable errors to the user.
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verifyAccess();
      }
    };

    window.addEventListener('focus', verifyAccess);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const interval = window.setInterval(verifyAccess, 60_000);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', verifyAccess);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [data?.household?.id, isAuthenticated, reload]);

  const handleRepositoryError = useCallback((err: unknown, fallback: string) => {
    setError(getErrorMessage(err, fallback));

    const householdId = data?.household?.id;
    if (!isAuthenticated || !householdId) return;

    budgetRepository
      .hasActiveHouseholdAccess(householdId)
      .then((hasAccess) => {
        if (!hasAccess) {
          void reload();
        }
      })
      .catch(() => undefined);
  }, [data?.household?.id, isAuthenticated, reload]);

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
    return data?.alerts
      .filter((alert) => isAlertRelevant(alert, categorySpending, budgetSummary))
      .map((alert) => ({
        ...alert,
        message: getCurrentAlertMessage(alert, categorySpending),
      })) || [];
  }, [data?.alerts, categorySpending, budgetSummary]);

  useEffect(() => {
    if (!data?.onboardingCompleted || !data.household) return;

    const staleAlerts = data.alerts.filter((alert) =>
      !alert.dismissed && !isAlertRelevant(alert, categorySpending, budgetSummary)
    );

    staleAlerts.forEach((alert) => {
      budgetRepository
        .dismissAlertRow(alert.id)
        .catch((err) => handleRepositoryError(err, 'Unable to clear stale alert'));
    });

    if (staleAlerts.length > 0) {
      const staleAlertIds = new Set(staleAlerts.map((alert) => alert.id));
      setData((prev) => (prev ? {
        ...prev,
        alerts: prev.alerts.map((alert) =>
          staleAlertIds.has(alert.id) ? { ...alert, dismissed: true } : alert
        ),
      } : prev));
    }

    const relevantExistingAlerts = data.alerts.filter((alert) =>
      alert.dismissed || isAlertRelevant(alert, categorySpending, budgetSummary)
    );
    const newAlerts = checkAndCreateAlerts(categorySpending, budgetSummary, relevantExistingAlerts);
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
        .catch((err) => handleRepositoryError(err, 'Unable to create alert'));
    });
  }, [categorySpending, budgetSummary, data?.alerts, data?.onboardingCompleted, data?.household, handleRepositoryError]);

  const addIncome = useCallback((income: Omit<Income, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertIncome(income, data)
      .then((created) => setData((prev) => (prev ? { ...prev, incomes: [...prev.incomes, created] } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to add income'));
  }, [data, handleRepositoryError]);

  const updateIncome = useCallback((incomeId: string, updates: Partial<Income>) => {
    budgetRepository.updateIncomeRow(incomeId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, incomes: prev.incomes.map((i) => i.id === incomeId ? updated : i) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to update income'));
  }, [handleRepositoryError]);

  const deleteIncome = useCallback((incomeId: string) => {
    budgetRepository.deleteIncomeRow(incomeId)
      .then(() => setData((prev) => (prev ? { ...prev, incomes: prev.incomes.filter((i) => i.id !== incomeId) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to delete income'));
  }, [handleRepositoryError]);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertExpense(expense, data)
      .then((created) => setData((prev) => (prev ? { ...prev, expenses: [...prev.expenses, created] } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to add expense'));
  }, [data, handleRepositoryError]);

  const updateExpense = useCallback((expenseId: string, updates: Partial<Expense>) => {
    budgetRepository.updateExpenseRow(expenseId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, expenses: prev.expenses.map((e) => e.id === expenseId ? updated : e) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to update expense'));
  }, [handleRepositoryError]);

  const deleteExpense = useCallback((expenseId: string) => {
    budgetRepository.deleteExpenseRow(expenseId)
      .then(() => setData((prev) => (prev ? { ...prev, expenses: prev.expenses.filter((e) => e.id !== expenseId) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to delete expense'));
  }, [handleRepositoryError]);

  const addCategory = useCallback((category: Omit<Category, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertCategory(category, data)
      .then(({ category: createdCategory, monthlyCategory }) => {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            categories: [...prev.categories, createdCategory],
            monthlyCategories: monthlyCategory
              ? [...prev.monthlyCategories, monthlyCategory]
              : prev.monthlyCategories,
          };
        });
      })
      .catch((err) => handleRepositoryError(err, 'Unable to add category'));
  }, [data, handleRepositoryError]);

  const updateCategory = useCallback((categoryId: string, updates: Partial<Category>) => {
    budgetRepository.updateCategoryRow(categoryId, updates)
      .then((updated) => {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            categories: prev.categories.map((category) => category.id === categoryId ? updated : category),
            monthlyCategories: prev.monthlyCategories.map((category) =>
              category.categoryId === categoryId ? { ...category, categoryName: updated.name } : category
            ),
            expenses: prev.expenses.map((expense) =>
              expense.categoryId === categoryId ? { ...expense, categoryName: updated.name } : expense
            ),
          };
        });
      })
      .catch((err) => handleRepositoryError(err, 'Unable to update category'));
  }, [handleRepositoryError]);

  const deleteCategory = useCallback((categoryId: string) => {
    budgetRepository.deleteCategoryRow(categoryId)
      .then(() => {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            categories: prev.categories.filter((category) => category.id !== categoryId),
            monthlyCategories: prev.monthlyCategories.filter((category) => category.categoryId !== categoryId),
          };
        });
      })
      .catch((err) => handleRepositoryError(err, 'Unable to delete category'));
  }, [handleRepositoryError]);

  const updateMonthlyCategory = useCallback((monthlyCategoryId: string, updates: Partial<MonthlyCategory>) => {
    budgetRepository.updateMonthlyCategoryRow(monthlyCategoryId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, monthlyCategories: prev.monthlyCategories.map((mc) => mc.id === monthlyCategoryId ? updated : mc) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to update monthly budget'));
  }, [handleRepositoryError]);

  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data) return;
    budgetRepository.insertSavingsGoal(goal, data)
      .then((created) => setData((prev) => (prev ? { ...prev, savingsGoals: [...prev.savingsGoals, created] } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to add savings goal'));
  }, [data, handleRepositoryError]);

  const updateSavingsGoal = useCallback((goalId: string, updates: Partial<SavingsGoal>) => {
    budgetRepository.updateSavingsGoalRow(goalId, updates)
      .then((updated) => setData((prev) => (prev ? {
        ...prev,
        savingsGoals: prev.savingsGoals.map((goal) => goal.id === goalId ? updated : goal),
      } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to update savings goal'));
  }, [handleRepositoryError]);

  const deleteSavingsGoal = useCallback((goalId: string) => {
    budgetRepository.deleteSavingsGoalRow(goalId)
      .then(() => setData((prev) => (prev ? {
        ...prev,
        savingsGoals: prev.savingsGoals.filter((goal) => goal.id !== goalId),
        savingsContributions: prev.savingsContributions.filter((contribution) => contribution.goalId !== goalId),
      } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to delete savings goal'));
  }, [handleRepositoryError]);

  const addSavingsContribution = useCallback((contribution: Omit<SavingsContribution, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertSavingsContribution(contribution, data)
      .then(({ contribution: createdContribution, goal }) => setData((prev) => (prev ? {
        ...prev,
        savingsContributions: [createdContribution, ...prev.savingsContributions],
        savingsGoals: prev.savingsGoals.map((item) => item.id === goal.id ? goal : item),
      } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to add savings contribution'));
  }, [data, handleRepositoryError]);

  const deleteSavingsContribution = useCallback((contributionId: string) => {
    if (!data) return;
    const contribution = data.savingsContributions.find((item) => item.id === contributionId);
    if (!contribution) return;

    budgetRepository.deleteSavingsContributionRow(contribution)
      .then((goal) => setData((prev) => (prev ? {
        ...prev,
        savingsContributions: prev.savingsContributions.filter((item) => item.id !== contributionId),
        savingsGoals: prev.savingsGoals.map((item) => item.id === goal.id ? goal : item),
      } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to delete savings contribution'));
  }, [data, handleRepositoryError]);

  const addRecurringTransaction = useCallback((recurring: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!data) return;
    budgetRepository.insertRecurringTransaction(recurring, data)
      .then((created) => setData((prev) => (prev ? { ...prev, recurringTransactions: [...prev.recurringTransactions, created] } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to add recurring item'));
  }, [data, handleRepositoryError]);

  const updateRecurringTransaction = useCallback((recurringId: string, updates: Partial<RecurringTransaction>) => {
    budgetRepository.updateRecurringTransactionRow(recurringId, updates)
      .then((updated) => setData((prev) => (prev ? {
        ...prev,
        recurringTransactions: prev.recurringTransactions.map((item) => item.id === recurringId ? updated : item),
      } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to update recurring item'));
  }, [handleRepositoryError]);

  const deleteRecurringTransaction = useCallback((recurringId: string) => {
    budgetRepository.deleteRecurringTransactionRow(recurringId)
      .then(() => setData((prev) => (prev ? {
        ...prev,
        recurringTransactions: prev.recurringTransactions.filter((item) => item.id !== recurringId),
      } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to delete recurring item'));
  }, [handleRepositoryError]);

  const postRecurringTransactionAction = useCallback(async (recurringId: string) => {
    if (!data) return null;
    const recurring = data.recurringTransactions.find((item) => item.id === recurringId);
    if (!recurring) return null;

    const alreadyPosted = recurring.type === 'income'
      ? data.incomes.some((income) =>
          income.date === recurring.nextDueDate &&
          income.amount === recurring.amount &&
          income.userId === recurring.userId &&
          (income.sourceId === recurring.sourceId || income.sourceName === (recurring.sourceName || recurring.name)) &&
          (income.notes === recurring.name || income.notes?.startsWith(`${recurring.name}:`))
        )
      : data.expenses.some((expense) =>
          expense.date === recurring.nextDueDate &&
          expense.amount === recurring.amount &&
          expense.userId === recurring.userId &&
          (expense.categoryId === recurring.categoryId || expense.categoryName === (recurring.categoryName || recurring.name)) &&
          (expense.notes === recurring.name || expense.notes?.startsWith(`${recurring.name}:`))
        );

    if (alreadyPosted) {
      const message = `${recurring.name} is already posted for ${recurring.nextDueDate}. Delete the posted ${recurring.type} before posting it again.`;
      setError(message);
      throw new Error(message);
    }

    try {
      const result = await budgetRepository.postRecurringTransaction(recurring, data);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recurringTransactions: prev.recurringTransactions.map((item) => item.id === recurringId ? result.recurring : item),
          incomes: result.income ? [result.income, ...prev.incomes] : prev.incomes,
          expenses: result.expense ? [result.expense, ...prev.expenses] : prev.expenses,
        };
      });
      setError(null);
      return result;
    } catch (err) {
      handleRepositoryError(err, 'Unable to post recurring item');
      throw err;
    }
  }, [data, handleRepositoryError]);

  const addIncomeSource = useCallback((source: Omit<IncomeSource, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertIncomeSource(source, data)
      .then((created) => setData((prev) => (prev ? { ...prev, incomeSources: [...prev.incomeSources, created] } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to add income source'));
  }, [data, handleRepositoryError]);

  const updateIncomeSource = useCallback((sourceId: string, updates: Partial<IncomeSource>) => {
    budgetRepository.updateIncomeSourceRow(sourceId, updates)
      .then((updated) => {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            incomeSources: prev.incomeSources.map((source) => source.id === sourceId ? updated : source),
            incomes: prev.incomes.map((income) =>
              income.sourceId === sourceId ? { ...income, sourceName: updated.name } : income
            ),
          };
        });
      })
      .catch((err) => handleRepositoryError(err, 'Unable to update income source'));
  }, [handleRepositoryError]);

  const deleteIncomeSource = useCallback((sourceId: string) => {
    budgetRepository.deleteIncomeSourceRow(sourceId)
      .then(() => setData((prev) => (prev ? { ...prev, incomeSources: prev.incomeSources.filter((s) => s.id !== sourceId) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to delete income source'));
  }, [handleRepositoryError]);

  const setHouseholdData = useCallback((household: Household) => {
    budgetRepository.updateHouseholdRow(household)
      .then((updated) => setData((prev) => (prev ? { ...prev, household: updated } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to update household'));
  }, [handleRepositoryError]);

  const addUserData = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    if (!data) return;
    budgetRepository.insertBudgetMember(user, data)
      .then((created) => setData((prev) => (prev ? { ...prev, users: [...prev.users, created] } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to add member'));
  }, [data, handleRepositoryError]);

  const inviteUser = useCallback(async (user: Omit<User, 'id' | 'createdAt'>) => {
    if (!data) {
      throw new Error('No household is loaded');
    }

    try {
      const invite = await budgetRepository.createHouseholdInvite(user, data);
      setData((prev) => {
        if (!prev) return prev;
        const existingUser = prev.users.some((member) => member.id === invite.member.id);
        return {
          ...prev,
          users: existingUser
            ? prev.users.map((member) => (member.id === invite.member.id ? invite.member : member))
            : [...prev.users, invite.member],
          householdInvites: [invite.invite, ...prev.householdInvites.filter((item) => item.id !== invite.invite.id)],
        };
      });
      return invite;
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to invite member');
      handleRepositoryError(err, 'Unable to invite member');
      throw new Error(message);
    }
  }, [data, handleRepositoryError]);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    budgetRepository.updateBudgetMember(userId, updates)
      .then((updated) => setData((prev) => (prev ? { ...prev, users: prev.users.map((u) => u.id === userId ? updated : u) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to update member'));
  }, [handleRepositoryError]);

  const deleteUser = useCallback((userId: string) => {
    budgetRepository.deleteBudgetMember(userId)
      .then(() => setData((prev) => (prev ? {
        ...prev,
        users: prev.users.filter((u) => u.id !== userId),
        householdInvites: prev.householdInvites.filter((invite) => invite.budgetMemberId !== userId),
      } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to delete member'));
  }, [handleRepositoryError]);

  const deleteInvite = useCallback((inviteId: string) => {
    budgetRepository.deleteHouseholdInvite(inviteId)
      .then(() => setData((prev) => {
        if (!prev) return prev;
        const deletedInvite = prev.householdInvites.find((invite) => invite.id === inviteId);
        const shouldRemovePlaceholder = Boolean(deletedInvite && !deletedInvite.acceptedAt && deletedInvite.budgetMemberId);

        return {
          ...prev,
          householdInvites: prev.householdInvites.filter((invite) => invite.id !== inviteId),
          users: shouldRemovePlaceholder
            ? prev.users.filter((user) => user.id !== deletedInvite?.budgetMemberId)
            : prev.users,
        };
      }))
      .catch((err) => handleRepositoryError(err, 'Unable to delete invite'));
  }, [handleRepositoryError]);

  const completeOnboarding = useCallback((
    household: Household,
    users: User[],
    incomeSources: IncomeSource[],
    categories: Category[]
  ) => {
    const month = getCurrentLocalMonth();
    budgetRepository.createHouseholdSetup(household, users, incomeSources, categories, month)
      .then((createdData) => {
        window.localStorage.removeItem(START_NEW_HOUSEHOLD_KEY);
        setIsStartingNewHousehold(false);
        setAccessStatus('ready');
        setRemovedHouseholdName(undefined);
        setData(createdData);
      })
      .catch((err) => handleRepositoryError(err, 'Unable to complete onboarding'));
  }, [handleRepositoryError]);

  const dismissAlert = useCallback((alertId: string) => {
    budgetRepository.dismissAlertRow(alertId)
      .then(() => setData((prev) => (prev ? { ...prev, alerts: prev.alerts.map((a) => a.id === alertId ? { ...a, dismissed: true } : a) } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to dismiss alert'));
  }, [handleRepositoryError]);

  const setCurrentMonthData = useCallback((month: string) => {
    setData((prev) => (prev ? { ...prev, currentMonth: month } : prev));
  }, []);

  const createMonthlyBudgetsAction = useCallback((month: string, budgetOverrides: Record<string, number> = {}) => {
    if (!data) return;

    const previousMonth = getPreviousMonth(month);
    const carryOvers = calculateCarryOvers(previousMonth, data.monthlyCategories, data.expenses, data.categories);
    const existingCategoryIds = new Set(
      data.monthlyCategories
        .filter((category) => category.month === month)
        .map((category) => category.categoryId)
    );
    const missingCategories = data.categories
      .filter((category) => !existingCategoryIds.has(category.id))
      .map((category) => ({
        ...category,
        monthlyBudget: budgetOverrides[category.id] ?? category.monthlyBudget,
      }));

    if (missingCategories.length === 0) return;

    budgetRepository.createMonthlyBudgets(month, missingCategories, carryOvers, data)
      .then((created) => setData((prev) => (prev ? { ...prev, monthlyCategories: [...prev.monthlyCategories, ...created] } : prev)))
      .catch((err) => handleRepositoryError(err, 'Unable to create monthly budgets'));
  }, [data, handleRepositoryError]);

  const startNewHousehold = useCallback(() => {
    window.localStorage.setItem(START_NEW_HOUSEHOLD_KEY, 'true');
    setIsStartingNewHousehold(true);
    setData({
      ...INITIAL_STORAGE,
      currentMonth: getCurrentLocalMonth(),
      lastMonthCheck: new Date().toISOString(),
    });
    setAccessStatus('needs_onboarding');
    setRemovedHouseholdName(undefined);
    router.push('/onboarding');
  }, [router]);

  if (!data || isLoading) {
    return <AppLoadingScreen />;
  }

  const canStartNewHousehold = isStartingNewHousehold && pathname === '/onboarding';

  if (isAuthenticated && accessStatus === 'removed' && !canStartNewHousehold) {
    return (
      <RemovedHouseholdScreen
        householdName={removedHouseholdName}
        onStartNewHousehold={startNewHousehold}
      />
    );
  }

  const value: BudgetContextType = {
    household: data.household,
    currentUser: data.currentUser,
    users: data.users,
    householdInvites: data.householdInvites,
    categories: data.categories,
    monthlyCategories: data.monthlyCategories,
    incomes: data.incomes,
    expenses: data.expenses,
    savingsGoals: data.savingsGoals,
    savingsContributions: data.savingsContributions,
    recurringTransactions: data.recurringTransactions,
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
    deleteCategory,
    updateMonthlyCategory,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addSavingsContribution,
    deleteSavingsContribution,
    addRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    postRecurringTransaction: postRecurringTransactionAction,
    addIncomeSource,
    updateIncomeSource,
    deleteIncomeSource,
    setHousehold: setHouseholdData,
    addUser: addUserData,
    inviteUser,
    updateUser,
    deleteUser,
    deleteInvite,
    completeOnboarding,
    dismissAlert,
    setCurrentMonth: setCurrentMonthData,
    createMonthlyBudgets: createMonthlyBudgetsAction,
    reload,
    isLoading: false,
    accessStatus,
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
