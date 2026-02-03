/**
 * Transaction Calculations
 * Functions for calculating transaction statistics
 */

import type { UnifiedTransaction, TransactionStats } from '@/types';

/**
 * Calculate statistics for a set of transactions
 */
export function calculateTransactionStats(transactions: UnifiedTransaction[]): TransactionStats {
  const totalCount = transactions.length;

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpense;

  const averageAmount = totalCount > 0 ? (totalIncome + totalExpense) / totalCount : 0;

  // Find date range
  const dates = transactions.map((t) => t.date).sort();
  const minDate = dates.length > 0 ? dates[0] : '';
  const maxDate = dates.length > 0 ? dates[dates.length - 1] : '';

  return {
    totalCount,
    totalIncome,
    totalExpense,
    netAmount,
    averageAmount,
    dateRange: {
      start: minDate,
      end: maxDate,
    },
  };
}
