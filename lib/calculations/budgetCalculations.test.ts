import { describe, expect, it } from 'vitest';
import {
  calculateBudgetSummary,
  calculateCategorySpending,
  calculateIncomeBreakdown,
} from './budgetCalculations';
import type { Expense, Income, MonthlyCategory, SavingsContribution } from '@/types';

describe('budget calculations', () => {
  const incomes: Income[] = [
    {
      id: 'income-1',
      amount: 4000,
      sourceId: 'salary',
      sourceName: 'Salary',
      userId: 'member-1',
      userName: 'Ugo',
      date: '2026-05-01',
      createdAt: '2026-05-01T00:00:00Z',
      createdBy: 'auth-1',
    },
    {
      id: 'income-2',
      amount: 500,
      sourceId: 'bonus',
      sourceName: 'Bonus',
      userId: 'member-1',
      userName: 'Ugo',
      date: '2026-04-01',
      createdAt: '2026-04-01T00:00:00Z',
      createdBy: 'auth-1',
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'expense-1',
      amount: 300,
      categoryId: 'groceries',
      categoryName: 'Groceries',
      needsOrWants: 'needs',
      userId: 'member-1',
      userName: 'Ugo',
      date: '2026-05-03',
      createdAt: '2026-05-03T00:00:00Z',
      createdBy: 'auth-1',
    },
    {
      id: 'expense-2',
      amount: 125,
      categoryId: 'fun',
      categoryName: 'Fun',
      needsOrWants: 'wants',
      userId: 'member-2',
      userName: 'Member',
      date: '2026-05-04',
      createdAt: '2026-05-04T00:00:00Z',
      createdBy: 'auth-2',
    },
  ];

  const monthlyCategories: MonthlyCategory[] = [
    {
      id: 'month-groceries',
      categoryId: 'groceries',
      categoryName: 'Groceries',
      monthlyBudget: 500,
      currentSpent: 0,
      carryOverAmount: 50,
      month: '2026-05',
      createdAt: '2026-05-01T00:00:00Z',
    },
    {
      id: 'month-fun',
      categoryId: 'fun',
      categoryName: 'Fun',
      monthlyBudget: 100,
      currentSpent: 0,
      carryOverAmount: 0,
      month: '2026-05',
      createdAt: '2026-05-01T00:00:00Z',
    },
  ];

  const savingsContributions: SavingsContribution[] = [
    {
      id: 'saving-1',
      goalId: 'goal-1',
      amount: 250,
      userId: 'member-1',
      userName: 'Ugo',
      date: '2026-05-05',
      createdAt: '2026-05-05T00:00:00Z',
    },
  ];

  it('summarizes a single month without leaking other months', () => {
    expect(calculateBudgetSummary(incomes, expenses, monthlyCategories, savingsContributions, '2026-05')).toEqual({
      totalIncome: 4000,
      totalBudgeted: 650,
      totalSpent: 425,
      remaining: 3325,
      netDisposableIncome: 3100,
      savingsBalance: 250,
    });
  });

  it('marks category spending health by threshold', () => {
    expect(calculateCategorySpending(monthlyCategories, expenses, '2026-05')).toEqual([
      {
        categoryId: 'groceries',
        categoryName: 'Groceries',
        budget: 550,
        spent: 300,
        remaining: 250,
        percentage: 54.54545454545454,
        status: 'healthy',
      },
      {
        categoryId: 'fun',
        categoryName: 'Fun',
        budget: 100,
        spent: 125,
        remaining: -25,
        percentage: 125,
        status: 'danger',
      },
    ]);
  });

  it('groups income by source for the selected month', () => {
    expect(calculateIncomeBreakdown(incomes, '2026-05')).toEqual([
      {
        sourceId: 'salary',
        sourceName: 'Salary',
        amount: 4000,
        percentage: 100,
      },
    ]);
  });
});
