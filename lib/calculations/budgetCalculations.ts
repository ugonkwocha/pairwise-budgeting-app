import {
  Income,
  Expense,
  MonthlyCategory,
  SavingsContribution,
  BudgetSummary,
  CategorySpending,
  IncomeBreakdown,
} from '@/types';

function getMonth(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function sumAmounts(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

export function calculateBudgetSummary(
  incomes: Income[],
  expenses: Expense[],
  monthlyCategories: MonthlyCategory[],
  savingsContributions: SavingsContribution[],
  month: string
): BudgetSummary {
  const monthIncomes = incomes.filter((i) => i.date.startsWith(month));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(month));
  const monthSavings = savingsContributions.filter((s) => s.date.startsWith(month));

  const totalIncome = sumAmounts(monthIncomes);
  const totalBudgeted = monthlyCategories
    .filter((c) => c.month === month)
    .reduce((sum, c) => sum + (c.monthlyBudget + c.carryOverAmount), 0);
  const totalSpent = sumAmounts(monthExpenses);
  const totalSavings = sumAmounts(monthSavings);

  const remaining = totalIncome - totalSpent - totalSavings;
  const netDisposableIncome = totalIncome - totalBudgeted - totalSavings;

  return {
    totalIncome,
    totalBudgeted,
    totalSpent,
    remaining,
    netDisposableIncome,
    savingsBalance: totalSavings,
  };
}

export function calculateCategorySpending(
  monthlyCategories: MonthlyCategory[],
  expenses: Expense[],
  month: string
): CategorySpending[] {
  return monthlyCategories
    .filter((c) => c.month === month)
    .map((category) => {
      const categoryExpenses = expenses.filter(
        (e) => e.categoryId === category.categoryId && e.date.startsWith(month)
      );

      const spent = sumAmounts(categoryExpenses);
      const budget = category.monthlyBudget + category.carryOverAmount;
      const remaining = budget - spent;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      let status: 'healthy' | 'warning' | 'danger' = 'healthy';
      if (percentage >= 100) {
        status = 'danger';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      return {
        categoryId: category.categoryId,
        categoryName: category.categoryName,
        budget,
        spent,
        remaining,
        percentage,
        status,
      };
    });
}

export function calculateIncomeBreakdown(
  incomes: Income[],
  month: string
): IncomeBreakdown[] {
  const monthIncomes = incomes.filter((i) => i.date.startsWith(month));
  const totalIncome = sumAmounts(monthIncomes);

  const breakdown: { [key: string]: { amount: number; name: string } } = {};

  monthIncomes.forEach((income) => {
    if (!breakdown[income.sourceId]) {
      breakdown[income.sourceId] = {
        amount: 0,
        name: income.sourceName,
      };
    }
    breakdown[income.sourceId].amount += income.amount;
  });

  return Object.entries(breakdown).map(([sourceId, data]) => ({
    sourceId,
    sourceName: data.name,
    amount: data.amount,
    percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
  }));
}

export function calculateSavingsProgress(
  goalTargetAmount: number,
  goalCurrentAmount: number
): number {
  if (goalTargetAmount <= 0) return 0;
  return Math.min((goalCurrentAmount / goalTargetAmount) * 100, 100);
}
