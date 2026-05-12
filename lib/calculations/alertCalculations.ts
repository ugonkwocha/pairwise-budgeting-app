import { CategorySpending, BudgetSummary, Alert } from '@/types';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function isCategoryExceeded(category: CategorySpending): boolean {
  return category.spent > category.budget;
}

function isCategoryWarning(category: CategorySpending): boolean {
  return category.budget > 0 && category.spent < category.budget && category.percentage >= 80;
}

export function getCurrentAlertMessage(
  alert: Alert,
  categorySpending: CategorySpending[]
): string {
  if (alert.type !== 'category_warning' && alert.type !== 'category_exceeded') {
    return alert.message;
  }

  const category = categorySpending.find((item) => item.categoryId === alert.categoryId);
  if (!category) {
    return alert.message;
  }

  if (alert.type === 'category_exceeded') {
    return `You've exceeded your budget for ${category.categoryName}. Spent $${category.spent.toFixed(2)} of $${category.budget.toFixed(2)}.`;
  }

  return `You're approaching your budget limit for ${category.categoryName}. $${category.remaining.toFixed(2)} remaining.`;
}

export function checkAndCreateAlerts(
  categorySpending: CategorySpending[],
  budgetSummary: BudgetSummary,
  existingAlerts: Alert[]
): Alert[] {
  const newAlerts: Alert[] = [];

  // Category alerts (80% warning, over 100% exceeded)
  categorySpending.forEach((cat) => {
    // Check if alert already exists
    const warningExists = existingAlerts.some(
      (a) => a.categoryId === cat.categoryId && a.type === 'category_warning' && !a.dismissed
    );

    const exceededExists = existingAlerts.some(
      (a) => a.categoryId === cat.categoryId && a.type === 'category_exceeded' && !a.dismissed
    );

    if (isCategoryExceeded(cat)) {
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
    } else if (isCategoryWarning(cat) && !warningExists && !exceededExists) {
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

export function isAlertRelevant(
  alert: Alert,
  categorySpending: CategorySpending[],
  budgetSummary: BudgetSummary
): boolean {
  if (alert.dismissed) {
    return false;
  }

  if (alert.type === 'total_exceeded') {
    return budgetSummary.totalSpent > budgetSummary.totalBudgeted;
  }

  if (alert.type === 'category_warning' || alert.type === 'category_exceeded') {
    if (!alert.categoryId) return false;

    const category = categorySpending.find((item) => item.categoryId === alert.categoryId);
    if (!category) return false;

    if (alert.type === 'category_exceeded') {
      return isCategoryExceeded(category);
    }

    return isCategoryWarning(category);
  }

  return true;
}
