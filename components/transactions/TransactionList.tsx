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
            className="h-24 bg-gray-200 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">📭</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
        <p className="text-gray-600">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Result count */}
      <div className="text-sm text-gray-600 mb-4">
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
          className="w-full mt-6 px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors"
        >
          Load More ({transactions.length - displayCount} remaining)
        </button>
      )}
    </div>
  );
}
