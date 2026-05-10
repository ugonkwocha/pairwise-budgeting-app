'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AddExpenseModal } from '@/components/expenses/AddExpenseModal';
import { EditExpenseModal } from '@/components/expenses/EditExpenseModal';
import { ConfirmDeleteModal } from '@/components/settings/ConfirmDeleteModal';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import type { Expense } from '@/types';
import { FiCreditCard, FiPlus } from 'react-icons/fi';

export default function ExpensesPage() {
  const { expenses, categories, currentMonth, household, deleteExpense } = useBudget();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const currency = household?.currency === 'NGN' ? '₦' : '$';

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Expenses
          </div>
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Expenses</h1>
              <p className="mt-6 text-base font-medium text-slate-950">Track and manage household spending</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 sm:w-[520px]">
                <MonthNavigation />
              </div>
              <Button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2">
                <FiPlus aria-hidden="true" />
                Add Expense
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-7 border-0 bg-orange-50">
          <CardHeader className="mb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Spent This Month</CardTitle>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-orange-600 shadow-sm">
              <FiCreditCard className="h-4 w-4" aria-hidden="true" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-slate-950">
              {currency}
              {totalSpent.toFixed(2)}
            </div>
            <p className="mt-3 text-xs font-semibold text-orange-600">{monthExpenses.length} entries this month</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-0">
          <CardHeader className="mb-0 border-b border-slate-100 p-5">
            <CardTitle className="text-sm uppercase tracking-wide">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {monthExpenses.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">No expenses recorded yet. Add one to get started.</p>
            ) : (
              <div className="space-y-3">
                {monthExpenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <div
                      key={expense.id}
                      className="flex flex-col gap-4 rounded-lg bg-slate-50 px-4 py-3 transition hover:bg-slate-100 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{expense.categoryName}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {new Date(expense.date).toLocaleDateString()} • {expense.userName}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <Badge variant={expense.needsOrWants === 'needs' ? 'success' : 'warning'} size="sm">
                          {expense.needsOrWants}
                        </Badge>
                        <div className="min-w-24 text-right font-semibold text-slate-950">
                          {currency}
                          {expense.amount.toFixed(2)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExpense(expense)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddExpenseModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {selectedExpense && (
        <EditExpenseModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
        />
      )}
      {selectedExpense && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedExpense(null);
          }}
          onConfirm={() => deleteExpense(selectedExpense.id)}
          title="Delete Expense"
          message={`Are you sure you want to delete this ${selectedExpense.categoryName} expense of ${currency}${selectedExpense.amount.toFixed(2)}? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
