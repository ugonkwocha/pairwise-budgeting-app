'use client';

import { useState } from 'react';
import type { UnifiedTransaction } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface TransactionListItemProps {
  transaction: UnifiedTransaction;
  currency: string;
}

export function TransactionListItem({ transaction, currency }: TransactionListItemProps) {
  const [showNotes, setShowNotes] = useState(false);

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const amountSign = isIncome ? '+' : '-';

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
      {/* Header with badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isIncome ? (
            <Badge variant="success" size="sm">
              Income
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              Expense
            </Badge>
          )}

          {transaction.type === 'expense' && transaction.needsOrWants && (
            <Badge
              variant={transaction.needsOrWants === 'needs' ? 'success' : 'warning'}
              size="sm"
            >
              {transaction.needsOrWants === 'needs' ? 'Needs' : 'Wants'}
            </Badge>
          )}
        </div>
        <div className={`text-lg font-bold ${amountColor}`}>
          {amountSign}
          {currency}
          {transaction.amount.toFixed(2)}
        </div>
      </div>

      {/* Category/Source and member info */}
      <div className="mb-2">
        <div className="font-semibold text-gray-900">{transaction.categoryOrSource}</div>
        <div className="text-sm text-gray-600">
          {transaction.userName} · {new Date(transaction.date).toLocaleDateString()}
        </div>
      </div>

      {/* Notes section (if present) */}
      {transaction.notes && (
        <>
          {!showNotes && (
            <button
              onClick={() => setShowNotes(true)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2"
            >
              View Notes
            </button>
          )}
          {showNotes && (
            <div className="mt-3 p-2 bg-white border border-gray-200 rounded text-sm text-gray-700">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-gray-900">Notes</span>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Hide
                </button>
              </div>
              <p className="whitespace-pre-wrap">{transaction.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
