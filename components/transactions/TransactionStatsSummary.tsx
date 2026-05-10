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

  const netColor = stats.netAmount >= 0 ? 'text-teal-600' : 'text-red-600';
  const tiles = [
    {
      label: 'Total Transactions',
      value: stats.totalCount.toString(),
      detail: `${formatDate(stats.dateRange.start)} to ${formatDate(stats.dateRange.end)}`,
      surface: 'bg-blue-50',
      accent: 'text-blue-600',
    },
    {
      label: 'Total Income',
      value: `${currency}${stats.totalIncome.toFixed(2)}`,
      detail: `Avg: ${currency}${(stats.totalCount > 0 ? stats.totalIncome / stats.totalCount : 0).toFixed(2)}`,
      surface: 'bg-teal-50',
      accent: 'text-teal-600',
    },
    {
      label: 'Total Expenses',
      value: `${currency}${stats.totalExpense.toFixed(2)}`,
      detail: `Avg: ${currency}${(stats.totalCount > 0 ? stats.totalExpense / stats.totalCount : 0).toFixed(2)}`,
      surface: 'bg-orange-50',
      accent: 'text-orange-600',
    },
    {
      label: 'Net Amount',
      value: `${stats.netAmount >= 0 ? '+' : ''}${currency}${stats.netAmount.toFixed(2)}`,
      detail: stats.netAmount >= 0 ? 'Surplus' : 'Deficit',
      surface: stats.netAmount >= 0 ? 'bg-cyan-50' : 'bg-red-50',
      accent: netColor,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className={`rounded-lg p-4 shadow-sm ${tile.surface}`}>
          <div className="mb-7 text-xs font-semibold uppercase tracking-wide text-slate-500">{tile.label}</div>
          <div className="text-2xl font-semibold tracking-tight text-slate-950">{tile.value}</div>
          <div className={`mt-3 text-xs font-semibold ${tile.accent}`}>{tile.detail}</div>
        </div>
      ))}
    </div>
  );
}
