/**
 * Analytics Calculations
 * Pure functions for calculating analytics data from expenses, incomes, categories, and budgets
 */

import type {
  Expense,
  Income,
  Category,
  User,
  BudgetSummary,
  CategorySpending,
} from '@/types';
import { getMonthsInRange } from '@/lib/utils/dateRangeUtils';

/**
 * Calculate spending trends over a date range
 * Groups expenses by month and separates needs vs wants
 */
export function calculateSpendingTrends(
  expenses: Expense[],
  startMonth: string,
  endMonth: string
): Array<{ month: string; totalSpent: number; needsSpent: number; wantsSpent: number }> {
  const months = getMonthsInRange(startMonth, endMonth);
  const trends = months.map((month) => {
    const monthExpenses = expenses.filter((e) => e.date.startsWith(month));

    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const needsSpent = monthExpenses
      .filter((e) => e.needsOrWants === 'needs')
      .reduce((sum, e) => sum + e.amount, 0);
    const wantsSpent = monthExpenses
      .filter((e) => e.needsOrWants === 'wants')
      .reduce((sum, e) => sum + e.amount, 0);

    return { month, totalSpent, needsSpent, wantsSpent };
  });

  return trends;
}

/**
 * Calculate income trends over a date range
 * Aggregates income by month and by source
 */
export function calculateIncomeTrends(
  incomes: Income[],
  startMonth: string,
  endMonth: string
): Array<{ month: string; totalIncome: number; bySource: Record<string, number> }> {
  const months = getMonthsInRange(startMonth, endMonth);
  const trends = months.map((month) => {
    const monthIncomes = incomes.filter((i) => i.date.startsWith(month));

    const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
    const bySource: Record<string, number> = {};

    monthIncomes.forEach((income) => {
      const source = income.sourceName || 'Unknown';
      bySource[source] = (bySource[source] || 0) + income.amount;
    });

    return { month, totalIncome, bySource };
  });

  return trends;
}

/**
 * Calculate category spending trends over a date range
 * Tracks each category's spending across multiple months
 */
export function calculateCategoryTrends(
  expenses: Expense[],
  categories: Category[],
  startMonth: string,
  endMonth: string
): Array<{ categoryId: string; categoryName: string; monthlyData: Array<{ month: string; spent: number }> }> {
  const months = getMonthsInRange(startMonth, endMonth);

  return categories.map((category) => {
    const monthlyData = months.map((month) => {
      const spent = expenses
        .filter((e) => e.categoryId === category.id && e.date.startsWith(month))
        .reduce((sum, e) => sum + e.amount, 0);

      return { month, spent };
    });

    return {
      categoryId: category.id,
      categoryName: category.name,
      monthlyData,
    };
  });
}

/**
 * Calculate month-over-month comparison metrics
 * Compares income, spending, and savings across specified months
 */
export function calculateMonthOverMonthComparison(
  expenses: Expense[],
  incomes: Income[],
  months: string[]
): Array<{ month: string; income: number; spent: number; saved: number; savingsRate: number }> {
  return months.map((month) => {
    const monthIncomes = incomes.filter((i) => i.date.startsWith(month));
    const monthExpenses = expenses.filter((e) => e.date.startsWith(month));

    const income = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
    const spent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const saved = income - spent;
    const savingsRate = income > 0 ? (saved / income) * 100 : 0;

    return { month, income, spent, saved, savingsRate };
  });
}

/**
 * Calculate overall budget health score
 * Analyzes budget adherence, category overruns, and financial health
 */
export function calculateBudgetHealthScore(
  budgetSummary: BudgetSummary,
  categorySpending: CategorySpending[]
): { score: number; status: 'excellent' | 'good' | 'fair' | 'poor'; factors: string[] } {
  const factors: string[] = [];
  let score = 100;

  // Check spending vs budget
  if (budgetSummary.totalBudgeted > 0) {
    const spendingPercentage = (budgetSummary.totalSpent / budgetSummary.totalBudgeted) * 100;

    if (spendingPercentage > 100) {
      score -= 30;
      factors.push('Over budget');
    } else if (spendingPercentage > 90) {
      score -= 15;
      factors.push('Approaching budget limit');
    } else {
      factors.push('Within budget');
    }
  }

  // Check for overspent categories
  const overspentCategories = categorySpending.filter((cs) => cs.spent > cs.budget);
  if (overspentCategories.length > 0) {
    score -= overspentCategories.length * 10;
    factors.push(`${overspentCategories.length} categories over budget`);
  }

  // Check savings rate
  if (budgetSummary.totalIncome > 0) {
    const savingsRate = (budgetSummary.remaining / budgetSummary.totalIncome) * 100;
    if (savingsRate >= 20) {
      factors.push('Good savings rate (20%+)');
    } else if (savingsRate >= 10) {
      score -= 10;
      factors.push('Low savings rate (10-20%)');
    } else {
      score -= 25;
      factors.push('Poor savings rate (<10%)');
    }
  }

  // Determine status
  let status: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) {
    status = 'excellent';
  } else if (score >= 60) {
    status = 'good';
  } else if (score >= 40) {
    status = 'fair';
  } else {
    status = 'poor';
  }

  return { score: Math.max(0, score), status, factors };
}

/**
 * Calculate spending distribution by user
 * Aggregates spending per household member
 */
export function calculateSpendingByUser(
  expenses: Expense[],
  users: User[],
  startMonth: string,
  endMonth: string
): Array<{ userId: string; userName: string; totalSpent: number; percentage: number }> {
  const months = getMonthsInRange(startMonth, endMonth);
  const filteredExpenses = expenses.filter((e) =>
    months.some((m) => e.date.startsWith(m))
  );

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return users.map((user) => {
    const userSpent = filteredExpenses
      .filter((e) => e.userId === user.id)
      .reduce((sum, e) => sum + e.amount, 0);

    const percentage = totalSpent > 0 ? (userSpent / totalSpent) * 100 : 0;

    return {
      userId: user.id,
      userName: user.name,
      totalSpent: userSpent,
      percentage,
    };
  });
}

/**
 * Calculate needs vs wants spending breakdown
 * Returns total and percentage for both categories
 */
export function calculateSpendingByNeedsWants(
  expenses: Expense[],
  startMonth: string,
  endMonth: string
): { needs: number; wants: number; needsPercentage: number; wantsPercentage: number } {
  const months = getMonthsInRange(startMonth, endMonth);
  const filteredExpenses = expenses.filter((e) =>
    months.some((m) => e.date.startsWith(m))
  );

  const needs = filteredExpenses
    .filter((e) => e.needsOrWants === 'needs')
    .reduce((sum, e) => sum + e.amount, 0);

  const wants = filteredExpenses
    .filter((e) => e.needsOrWants === 'wants')
    .reduce((sum, e) => sum + e.amount, 0);

  const total = needs + wants;
  const needsPercentage = total > 0 ? (needs / total) * 100 : 0;
  const wantsPercentage = total > 0 ? (wants / total) * 100 : 0;

  return { needs, wants, needsPercentage, wantsPercentage };
}

/**
 * Get top spending categories
 * Returns categories with highest spending in date range
 */
export function calculateTopSpendingCategories(
  expenses: Expense[],
  limit: number = 5,
  startMonth: string,
  endMonth: string
): Array<{ categoryId: string; categoryName: string; totalSpent: number; percentage: number }> {
  const months = getMonthsInRange(startMonth, endMonth);
  const filteredExpenses = expenses.filter((e) =>
    months.some((m) => e.date.startsWith(m))
  );

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const categoryMap: Record<string, { name: string; spent: number }> = {};

  filteredExpenses.forEach((expense) => {
    if (!categoryMap[expense.categoryId]) {
      categoryMap[expense.categoryId] = { name: expense.categoryName, spent: 0 };
    }
    categoryMap[expense.categoryId].spent += expense.amount;
  });

  return Object.entries(categoryMap)
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      totalSpent: data.spent,
      percentage: totalSpent > 0 ? (data.spent / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

/**
 * Calculate average spending metrics per category
 * Useful for identifying consistent spending patterns
 */
export function calculateCategoryAverages(
  expenses: Expense[],
  months: string[]
): Array<{
  categoryId: string;
  categoryName: string;
  avgSpent: number;
  totalSpent: number;
  monthCount: number;
}> {
  const filteredExpenses = expenses.filter((e) =>
    months.some((m) => e.date.startsWith(m))
  );

  const categoryMap: Record<string, { name: string; spent: number; months: Set<string> }> = {};

  filteredExpenses.forEach((expense) => {
    const month = expense.date.substring(0, 7);
    if (!categoryMap[expense.categoryId]) {
      categoryMap[expense.categoryId] = { name: expense.categoryName, spent: 0, months: new Set() };
    }
    categoryMap[expense.categoryId].spent += expense.amount;
    categoryMap[expense.categoryId].months.add(month);
  });

  return Object.entries(categoryMap)
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      totalSpent: data.spent,
      monthCount: data.months.size,
      avgSpent: data.months.size > 0 ? data.spent / data.months.size : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);
}
