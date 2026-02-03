import { CategorySpending, BudgetSummary, Alert } from '@/types';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export function checkAndCreateAlerts(
  categorySpending: CategorySpending[],
  budgetSummary: BudgetSummary,
  existingAlerts: Alert[]
): Alert[] {
  const newAlerts: Alert[] = [];

  // Category alerts (80% warning, 100% exceeded)
  categorySpending.forEach((cat) => {
    // Check if alert already exists
    const warningExists = existingAlerts.some(
      (a) => a.categoryId === cat.categoryId && a.type === 'category_warning' && !a.dismissed
    );

    const exceededExists = existingAlerts.some(
      (a) => a.categoryId === cat.categoryId && a.type === 'category_exceeded' && !a.dismissed
    );

    if (cat.percentage >= 100) {
      if (!exceededExists) {
        newAlerts.push({
          id: generateId(),
          type: 'category_exceeded',
          severity: 'danger',
          message: `You've exceeded your budget for ${cat.categoryName}. Spent $${cat.spent.toFixed(2)} of $${cat.budget.toFixed(2)}.`,
          categoryId: cat.categoryId,
          dismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    } else if (cat.percentage >= 80 && !warningExists && !exceededExists) {
      newAlerts.push({
        id: generateId(),
        type: 'category_warning',
        severity: 'warning',
        message: `You're approaching your budget limit for ${cat.categoryName}. $${cat.remaining.toFixed(2)} remaining.`,
        categoryId: cat.categoryId,
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  // Total spending alert
  if (budgetSummary.totalSpent > budgetSummary.totalBudgeted) {
    const totalAlertExists = existingAlerts.some((a) => a.type === 'total_exceeded' && !a.dismissed);

    if (!totalAlertExists) {
      newAlerts.push({
        id: generateId(),
        type: 'total_exceeded',
        severity: 'danger',
        message: `Total spending has exceeded your planned monthly budget. Consider adjusting expenses or increasing budgets.`,
        dismissed: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return newAlerts;
}
