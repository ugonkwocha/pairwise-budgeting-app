'use client';

import { useState } from 'react';
import type { UnifiedTransaction } from '@/types';
import { TransactionListItem } from './TransactionListItem';

interface TransactionListProps {
  transactions: UnifiedTransaction[];
  currency: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export function TransactionList({
  transactions,
  currency,
  isLoading = false,
  onLoadMore,
}: TransactionListProps) {
  const [displayCount, setDisplayCount] = useState(50);

  const displayedTransactions = transactions.slice(0, displayCount);
  const hasMore = displayCount < transactions.length;

  const handleLoadMore = () => {
    setDisplayCount((prev) => prev + 50);
    onLoadMore?.();
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-slate-200"
          />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="mb-2 text-lg font-semibold text-slate-950">No transactions found</h3>
        <p className="text-sm text-slate-500">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Result count */}
      <div className="mb-4 text-sm font-medium text-slate-500">
        Showing {displayedTransactions.length} of {transactions.length} transactions
      </div>

      {/* Transaction list */}
      <div className="space-y-3">
        {displayedTransactions.map((transaction) => (
          <TransactionListItem
            key={transaction.id}
            transaction={transaction}
            currency={currency}
          />
        ))}
      </div>

      {/* Load More button */}
      {hasMore && (
        <button
          onClick={handleLoadMore}
          className="mt-6 w-full rounded-lg border border-slate-200 px-4 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-50"
        >
          Load More ({transactions.length - displayCount} remaining)
        </button>
      )}
    </div>
  );
}
