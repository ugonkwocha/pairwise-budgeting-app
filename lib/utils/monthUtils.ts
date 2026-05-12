import type { MonthlyCategory, Expense, Category } from '@/types';
import { formatLocalMonth, getCurrentLocalMonth } from './dateUtils';

export function getPreviousMonth(month: string): string {
  const [year, monthStr] = month.split('-');
  let yearNum = parseInt(year);
  let monthNum = parseInt(monthStr);

  monthNum -= 1;
  if (monthNum < 1) {
    monthNum = 12;
    yearNum -= 1;
  }

  return `${yearNum}-${String(monthNum).padStart(2, '0')}`;
}

export function getNextMonth(month: string): string {
  const [year, monthStr] = month.split('-');
  let yearNum = parseInt(year);
  let monthNum = parseInt(monthStr);

  monthNum += 1;
  if (monthNum > 12) {
    monthNum = 1;
    yearNum += 1;
  }

  return `${yearNum}-${String(monthNum).padStart(2, '0')}`;
}

export function formatMonthDisplay(month: string): string {
  return formatLocalMonth(month, { month: 'long', year: 'numeric' });
}

export function getCurrentMonth(): string {
  return getCurrentLocalMonth();
}

export function isCurrentMonth(month: string): boolean {
  return month === getCurrentMonth();
}

export function isFutureMonth(month: string): boolean {
  return month > getCurrentMonth();
}

export function calculateCarryOvers(
  previousMonth: string,
  monthlyCategories: MonthlyCategory[],
  expenses: Expense[],
  categories: Category[]
): Record<string, number> {
  const carryOvers: Record<string, number> = {};

  categories.forEach((category) => {
    // Find previous month's budget for this category
    const prevMonthly = monthlyCategories.find(
      (mc) => mc.categoryId === category.id && mc.month === previousMonth
    );

    if (!prevMonthly) {
      // No previous month data, carry-over is 0
      carryOvers[category.id] = 0;
      return;
    }

    // Calculate spent in previous month
    const prevSpent = expenses
      .filter((e) => e.categoryId === category.id && e.date.startsWith(previousMonth))
      .reduce((sum, e) => sum + e.amount, 0);

    // Total budget available = budget + carry-over
    const totalBudget = prevMonthly.monthlyBudget + prevMonthly.carryOverAmount;

    // Remaining = budget - spent
    const remaining = totalBudget - prevSpent;

    // Only carry over if:
    // 1. Category has carry-over enabled
    // 2. There's a positive remaining balance
    if (category.carryOverEnabled && remaining > 0) {
      carryOvers[category.id] = remaining;
    } else {
      carryOvers[category.id] = 0;
    }
  });

  return carryOvers;
}
