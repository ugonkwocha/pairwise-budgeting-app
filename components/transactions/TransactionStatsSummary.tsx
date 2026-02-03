'use client';

import type { TransactionStats } from '@/types';

interface TransactionStatsSummaryProps {
  stats: TransactionStats;
  currency: string;
}

export function TransactionStatsSummary({ stats, currency }: TransactionStatsSummaryProps) {
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const netColor = stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Transactions */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600 mb-2">Total Transactions</div>
        <div className="text-3xl font-bold text-gray-900">{stats.totalCount}</div>
        <div className="text-xs text-gray-500 mt-2">
          {formatDate(stats.dateRange.start)} to {formatDate(stats.dateRange.end)}
        </div>
      </div>

      {/* Total Income */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600 mb-2">Total Income</div>
        <div className="text-3xl font-bold text-green-600">
          {currency}
          {stats.totalIncome.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Avg: {currency}
          {(stats.totalCount > 0 ? stats.totalIncome / stats.totalCount : 0).toFixed(2)}
        </div>
      </div>

      {/* Total Expenses */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600 mb-2">Total Expenses</div>
        <div className="text-3xl font-bold text-red-600">
          {currency}
          {stats.totalExpense.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Avg: {currency}
          {(stats.totalCount > 0 ? stats.totalExpense / stats.totalCount : 0).toFixed(2)}
        </div>
      </div>

      {/* Net Amount */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-sm text-gray-600 mb-2">Net Amount</div>
        <div className={`text-3xl font-bold ${netColor}`}>
          {stats.netAmount >= 0 ? '+' : ''}
          {currency}
          {stats.netAmount.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          {stats.netAmount >= 0 ? 'Surplus' : 'Deficit'}
        </div>
      </div>
    </div>
  );
}
