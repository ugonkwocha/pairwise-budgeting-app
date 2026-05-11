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
import { Button } from '@/components/ui/Button';

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
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Transactions
          </div>
          <div className="border-b border-slate-200 pb-6">
            <h1 className="text-2xl font-semibold text-slate-950">Transactions</h1>
            <p className="mt-6 text-base font-medium text-slate-950">View and manage all income and expense activity</p>
          </div>
        </div>

        <div className="mb-7">
          <TransactionStatsSummary stats={stats} currency={currency} />
        </div>

        <Card className="mb-6 border-slate-200 bg-white">
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

        <div className="mb-6">
          <TransactionSortControls sort={sort} onChange={handleSortChange} />
        </div>

        <Card className="border-slate-200 bg-white">
          <CardContent className="pt-6">
            {sortedTransactions.length === 0 && Object.keys(filters).length > 0 ? (
              <div className="text-center py-12">
                <h3 className="mb-2 text-lg font-semibold text-slate-950">
                  No transactions match your filters
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Try adjusting your filter criteria to see more results.
                </p>
                <Button onClick={() => setFilters({})}>
                  Clear Filters
                </Button>
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
