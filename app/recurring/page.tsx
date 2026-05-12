'use client';

import { useState } from 'react';
import { FiCheckCircle, FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { RecurringTransactionModal } from '@/components/recurring/RecurringTransactionModal';
import { formatLocalDate, parseLocalDate } from '@/lib/utils/dateUtils';
import type { RecurringTransaction } from '@/types';

function formatDate(value: string) {
  return formatLocalDate(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysUntil(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = parseLocalDate(value);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

function frequencyLabel(value: string) {
  const labels: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };
  return labels[value] || value;
}

export default function RecurringPage() {
  const {
    household,
    recurringTransactions,
    deleteRecurringTransaction,
    postRecurringTransaction,
  } = useBudget();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);

  const activeItems = recurringTransactions.filter((item) => item.isActive);
  const inactiveItems = recurringTransactions.filter((item) => !item.isActive);
  const upcomingBills = activeItems
    .filter((item) => item.type === 'expense')
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate))
    .slice(0, 6);

  if (!household) {
    return null;
  }

  const currencySymbol = household.currency === 'NGN' ? '₦' : '$';

  const openAddModal = () => {
    setEditingRecurring(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: RecurringTransaction) => {
    setEditingRecurring(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecurring(null);
  };

  const renderRecurringRow = (item: RecurringTransaction) => {
    const dueIn = daysUntil(item.nextDueDate);
    const dueTone = dueIn < 0 ? 'text-red-600' : dueIn <= 7 ? 'text-orange-600' : 'text-slate-500';

    return (
      <div key={item.id} className="grid grid-cols-1 gap-4 rounded-lg bg-slate-50 px-4 py-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-950">{item.name}</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              item.type === 'income' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'
            }`}>
              {item.type === 'income' ? 'Income' : 'Expense'}
            </span>
            {!item.isActive && (
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">Inactive</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
            <span>{currencySymbol}{item.amount.toFixed(2)} {frequencyLabel(item.frequency).toLowerCase()}</span>
            <span>{item.type === 'income' ? item.sourceName : item.categoryName}</span>
            <span>{item.userName}</span>
            <span className={dueTone}>
              Due {formatDate(item.nextDueDate)}
              {dueIn === 0 ? ' today' : dueIn > 0 ? ` in ${dueIn} day${dueIn === 1 ? '' : 's'}` : ` ${Math.abs(dueIn)} day${Math.abs(dueIn) === 1 ? '' : 's'} late`}
            </span>
          </div>
          {item.notes && <p className="mt-2 text-sm text-slate-500">{item.notes}</p>}
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {item.isActive && (
            <Button type="button" size="sm" onClick={() => postRecurringTransaction(item.id)}>
              <FiCheckCircle className="h-4 w-4" aria-hidden="true" />
              Post
            </Button>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={() => openEditModal(item)}>
            <FiEdit2 className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => deleteRecurringTransaction(item.id)}>
            <FiTrash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Recurring
          </div>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-slate-950">Recurring</h1>
              <p className="mt-3 text-sm text-slate-500">Track salary, rent, subscriptions, bills, and other repeating items.</p>
            </div>
            <Button type="button" onClick={openAddModal} className="w-full shrink-0 sm:w-auto">
              <FiPlus className="h-4 w-4" aria-hidden="true" />
              Add Recurring
            </Button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="border-slate-200 bg-white lg:col-span-2">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm uppercase tracking-wide">Recurring Items</CardTitle>
              <span className="text-sm font-medium text-slate-500">{activeItems.length} active</span>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeItems.map(renderRecurringRow)}
                {activeItems.length === 0 && (
                  <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No recurring items yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">Upcoming Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingBills.map((bill) => {
                  const dueIn = daysUntil(bill.nextDueDate);
                  return (
                    <div key={bill.id} className="rounded-lg border border-slate-100 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-950">{bill.name}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{formatDate(bill.nextDueDate)}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-slate-950">{currencySymbol}{bill.amount.toFixed(2)}</p>
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${dueIn < 0 ? 'text-red-600' : dueIn <= 7 ? 'text-orange-600' : 'text-teal-600'}`}>
                        {dueIn === 0 ? 'Due today' : dueIn > 0 ? `Due in ${dueIn} day${dueIn === 1 ? '' : 's'}` : `${Math.abs(dueIn)} day${Math.abs(dueIn) === 1 ? '' : 's'} late`}
                      </p>
                    </div>
                  );
                })}
                {upcomingBills.length === 0 && (
                  <p className="py-8 text-center text-sm text-slate-500">No upcoming recurring bills.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {inactiveItems.length > 0 && (
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wide">Inactive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inactiveItems.map(renderRecurringRow)}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <RecurringTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        recurring={editingRecurring}
      />
    </div>
  );
}
