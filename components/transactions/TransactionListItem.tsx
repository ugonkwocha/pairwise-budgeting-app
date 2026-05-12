'use client';

import { useState } from 'react';
import type { UnifiedTransaction } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatLocalDate } from '@/lib/utils/dateUtils';

interface TransactionListItemProps {
  transaction: UnifiedTransaction;
  currency: string;
}

export function TransactionListItem({ transaction, currency }: TransactionListItemProps) {
  const [showNotes, setShowNotes] = useState(false);

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? 'text-teal-600' : 'text-red-600';
  const amountSign = isIncome ? '+' : '-';

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
      <div className="mb-2 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <div className="flex flex-wrap items-center gap-2">
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
        <div className={`shrink-0 text-lg font-semibold ${amountColor}`}>
          {amountSign}
          {currency}
          {transaction.amount.toFixed(2)}
        </div>
      </div>

      <div className="mb-2 min-w-0">
        <div className="break-words font-semibold text-slate-950">{transaction.categoryOrSource}</div>
        <div className="text-sm text-slate-500">
          {transaction.userName} · {formatLocalDate(transaction.date)}
        </div>
      </div>

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
            <div className="mt-3 rounded border border-slate-200 bg-white p-2 text-sm text-slate-700">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-slate-950">Notes</span>
                <button
                  onClick={() => setShowNotes(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
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
