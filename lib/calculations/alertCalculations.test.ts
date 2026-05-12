import { describe, expect, it } from 'vitest';
import { checkAndCreateAlerts, getCurrentAlertMessage, isAlertRelevant } from './alertCalculations';
import type { Alert, BudgetSummary, CategorySpending } from '@/types';

describe('alert calculations', () => {
  const summary: BudgetSummary = {
    totalIncome: 1500,
    totalBudgeted: 2450,
    totalSpent: 0,
    remaining: 1500,
    netDisposableIncome: 1500,
    savingsBalance: 0,
  };

  const totalExceededAlert: Alert = {
    id: 'alert-total',
    type: 'total_exceeded',
    severity: 'danger',
    message: 'Total spending has exceeded your planned monthly budget.',
    dismissed: false,
    createdAt: '2026-05-12T00:00:00Z',
  };

  const categorySpending: CategorySpending[] = [
    {
      categoryId: 'groceries',
      categoryName: 'Groceries',
      budget: 500,
      spent: 0,
      remaining: 500,
      percentage: 0,
      status: 'healthy',
    },
  ];

  it('marks total exceeded alerts stale once spending is back under budget', () => {
    expect(isAlertRelevant(totalExceededAlert, categorySpending, summary)).toBe(false);
  });

  it('creates total exceeded alerts only when spending is actually over budget', () => {
    expect(checkAndCreateAlerts(categorySpending, summary, [])).toEqual([]);

    const overBudgetSummary = {
      ...summary,
      totalSpent: 2600,
      remaining: -1100,
    };

    expect(checkAndCreateAlerts(categorySpending, overBudgetSummary, [])).toMatchObject([
      {
        type: 'total_exceeded',
        severity: 'danger',
        dismissed: false,
      },
    ]);
  });

  it('marks category alerts stale when the category drops below the threshold', () => {
    const categoryWarning: Alert = {
      id: 'alert-category',
      type: 'category_warning',
      severity: 'warning',
      message: 'Approaching budget.',
      categoryId: 'groceries',
      dismissed: false,
      createdAt: '2026-05-12T00:00:00Z',
    };

    expect(isAlertRelevant(categoryWarning, categorySpending, summary)).toBe(false);
  });

  it('does not mark a category exceeded when spending equals the budget', () => {
    const exactCategory: CategorySpending[] = [
      {
        categoryId: 'rent',
        categoryName: 'Rent/Mortgage',
        budget: 2850,
        spent: 2850,
        remaining: 0,
        percentage: 100,
        status: 'warning',
      },
    ];
    const oldExceededAlert: Alert = {
      id: 'alert-rent',
      type: 'category_exceeded',
      severity: 'danger',
      message: "You've exceeded your budget for Rent/Mortgage. Spent $2850.00 of $1200.00.",
      categoryId: 'rent',
      dismissed: false,
      createdAt: '2026-05-12T00:00:00Z',
    };

    expect(checkAndCreateAlerts(exactCategory, summary, [])).toEqual([]);
    expect(isAlertRelevant(oldExceededAlert, exactCategory, summary)).toBe(false);
  });

  it('uses current category amounts when displaying an active category alert', () => {
    const overCategory: CategorySpending[] = [
      {
        categoryId: 'rent',
        categoryName: 'Rent/Mortgage',
        budget: 2850,
        spent: 3000,
        remaining: -150,
        percentage: 105.26315789473684,
        status: 'danger',
      },
    ];
    const oldExceededAlert: Alert = {
      id: 'alert-rent',
      type: 'category_exceeded',
      severity: 'danger',
      message: "You've exceeded your budget for Rent/Mortgage. Spent $2850.00 of $1200.00.",
      categoryId: 'rent',
      dismissed: false,
      createdAt: '2026-05-12T00:00:00Z',
    };

    expect(isAlertRelevant(oldExceededAlert, overCategory, summary)).toBe(true);
    expect(getCurrentAlertMessage(oldExceededAlert, overCategory)).toBe(
      "You've exceeded your budget for Rent/Mortgage. Spent $3000.00 of $2850.00."
    );
  });
});
