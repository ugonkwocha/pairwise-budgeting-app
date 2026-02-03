/**
 * Transaction Utilities
 * Functions for combining, filtering, and sorting transactions
 */

import type {
  Income,
  Expense,
  UnifiedTransaction,
  TransactionFilters,
  TransactionSort,
  Category,
  IncomeSource,
  User,
} from '@/types';

/**
 * Combine income and expense arrays into unified transaction format
 */
export function combineTransactions(incomes: Income[], expenses: Expense[]): UnifiedTransaction[] {
  const unifiedIncomes: UnifiedTransaction[] = incomes.map((income) => ({
    id: income.id,
    type: 'income',
    amount: income.amount,
    categoryOrSource: income.sourceName,
    categoryOrSourceId: income.sourceId,
    userId: income.userId,
    userName: income.userName,
    date: income.date,
    notes: income.notes,
    createdAt: income.createdAt,
  }));

  const unifiedExpenses: UnifiedTransaction[] = expenses.map((expense) => ({
    id: expense.id,
    type: 'expense',
    amount: expense.amount,
    categoryOrSource: expense.categoryName,
    categoryOrSourceId: expense.categoryId,
    userId: expense.userId,
    userName: expense.userName,
    date: expense.date,
    notes: expense.notes,
    needsOrWants: expense.needsOrWants,
    createdAt: expense.createdAt,
  }));

  return [...unifiedIncomes, ...unifiedExpenses];
}

/**
 * Filter transactions based on provided filter criteria
 */
export function filterTransactions(
  transactions: UnifiedTransaction[],
  filters: TransactionFilters
): UnifiedTransaction[] {
  return transactions.filter((transaction) => {
    // Filter by type
    if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange?.start || filters.dateRange?.end) {
      const transactionDate = transaction.date;
      if (filters.dateRange.start && transactionDate < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange.end && transactionDate > filters.dateRange.end) {
        return false;
      }
    }

    // Filter by category/source
    if (filters.categoryOrSourceIds && filters.categoryOrSourceIds.length > 0) {
      if (!filters.categoryOrSourceIds.includes(transaction.categoryOrSourceId)) {
        return false;
      }
    }

    // Filter by user
    if (filters.userIds && filters.userIds.length > 0) {
      if (!filters.userIds.includes(transaction.userId)) {
        return false;
      }
    }

    // Filter by amount range
    if (filters.amountRange?.min !== undefined && transaction.amount < filters.amountRange.min) {
      return false;
    }
    if (filters.amountRange?.max !== undefined && transaction.amount > filters.amountRange.max) {
      return false;
    }

    // Filter by needs/wants (only for expenses)
    if (
      transaction.type === 'expense' &&
      filters.needsOrWants &&
      filters.needsOrWants !== 'all' &&
      transaction.needsOrWants !== filters.needsOrWants
    ) {
      return false;
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase().trim();
      const searchableText = [
        transaction.categoryOrSource,
        transaction.userName,
        transaction.notes || '',
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort transactions based on provided sort criteria
 */
export function sortTransactions(
  transactions: UnifiedTransaction[],
  sort: TransactionSort
): UnifiedTransaction[] {
  const sorted = [...transactions];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'categoryOrSource':
        comparison = a.categoryOrSource.localeCompare(b.categoryOrSource);
        break;
      case 'userName':
        comparison = a.userName.localeCompare(b.userName);
        break;
      default:
        comparison = 0;
    }

    // Apply sort direction
    if (sort.direction === 'desc') {
      comparison *= -1;
    }

    return comparison;
  });

  return sorted;
}

/**
 * Get available filter options from transactions
 */
export function getFilterOptions(
  incomes: Income[],
  expenses: Expense[],
  categories: Category[],
  incomeSources: IncomeSource[],
  users: User[]
): {
  categories: Category[];
  incomeSources: IncomeSource[];
  users: User[];
  dateRange: { min: string; max: string };
} {
  // Find date range
  const allDates = [
    ...incomes.map((i) => i.date),
    ...expenses.map((e) => e.date),
  ].filter((date) => date);

  const minDate = allDates.length > 0 ? allDates.sort()[0] : '';
  const maxDate = allDates.length > 0 ? allDates.sort().reverse()[0] : '';

  return {
    categories,
    incomeSources,
    users,
    dateRange: {
      min: minDate,
      max: maxDate,
    },
  };
}
