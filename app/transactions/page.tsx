'use client';

import { useState, useMemo, useCallback } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionSortControls } from '@/components/transactions/TransactionSortControls';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionStatsSummary } from '@/components/transactions/TransactionStatsSummary';
import type { TransactionFilters as TFilters, TransactionSort } from '@/types';
import {
  combineTransactions,
  filterTransactions,
  sortTransactions,
  getFilterOptions,
} from '@/lib/utils/transactionUtils';
import { calculateTransactionStats } from '@/lib/calculations/transactionCalculations';
import { getCurrentMonth, getPreviousMonth } from '@/lib/utils/monthUtils';

const DEFAULT_SORT: TransactionSort = {
  field: 'date',
  direction: 'desc',
};

export default function TransactionsPage() {
  const { incomes, expenses, categories, incomeSources, users, household } = useBudget();
  const [filters, setFilters] = useState<TFilters>(() => {
    // Default to last 3 months
    const currentMonth = getCurrentMonth();
    const threeMonthsAgo = getPreviousMonth(getPreviousMonth(currentMonth));
    return {
      dateRange: {
        start: threeMonthsAgo,
        end: currentMonth,
      },
    };
  });
  const [sort, setSort] = useState<TransactionSort>(DEFAULT_SORT);

  // Get available months for filter
  const availableMonths = useMemo(() => {
    const filterOpts = getFilterOptions(incomes, expenses, categories, incomeSources, users);
    return filterOpts.dateRange;
  }, [incomes, expenses, categories, incomeSources, users]);

  // Combine transactions
  const unifiedTransactions = useMemo(() => {
    return combineTransactions(incomes, expenses);
  }, [incomes, expenses]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return filterTransactions(unifiedTransactions, filters);
  }, [unifiedTransactions, filters]);

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return sortTransactions(filteredTransactions, sort);
  }, [filteredTransactions, sort]);

  // Calculate stats
  const stats = useMemo(() => {
    return calculateTransactionStats(sortedTransactions);
  }, [sortedTransactions]);

  const handleFiltersChange = useCallback((newFilters: TFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((newSort: TransactionSort) => {
    setSort(newSort);
  }, []);

  const currency = household?.currency === 'NGN' ? '₦' : '$';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-2">View and manage all your income and expense transactions</p>
        </div>

        {/* Stats Summary */}
        <div className="mb-8">
          <TransactionStatsSummary stats={stats} currency={currency} />
        </div>

        {/* Filters Card */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <TransactionFilters
              filters={filters}
              onChange={handleFiltersChange}
              categories={categories}
              incomeSources={incomeSources}
              users={users}
              availableMonths={availableMonths}
            />
          </CardContent>
        </Card>

        {/* Sort Controls */}
        <div className="mb-8">
          <TransactionSortControls sort={sort} onChange={handleSortChange} />
        </div>

        {/* Transactions List */}
        <Card>
          <CardContent className="pt-6">
            {sortedTransactions.length === 0 && Object.keys(filters).length > 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No transactions match your filters
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filter criteria to see more results.
                </p>
                <button
                  onClick={() => setFilters({})}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <TransactionList transactions={sortedTransactions} currency={currency} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
