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

export default function ExpensesPage() {
  const { expenses, categories, currentMonth, household, deleteExpense } = useBudget();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleDeleteExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="text-gray-600 mt-2">Track and manage household spending</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>+ Add Expense</Button>
        </div>

        <MonthNavigation />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Total Spent This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">
              {household?.currency === 'NGN' ? '₦' : '$'}
              {totalSpent.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {monthExpenses.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No expenses recorded yet. Add one to get started!</p>
            ) : (
              <div className="space-y-4">
                {monthExpenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{expense.categoryName}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(expense.date).toLocaleDateString()} • {expense.userName}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={expense.needsOrWants === 'needs' ? 'success' : 'warning'} size="sm">
                          {expense.needsOrWants}
                        </Badge>
                        <div className="font-bold text-gray-900 min-w-24 text-right">
                          {household?.currency === 'NGN' ? '₦' : '$'}
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
          message={`Are you sure you want to delete this ${selectedExpense.categoryName} expense of ${household?.currency === 'NGN' ? '₦' : '$'}${selectedExpense.amount.toFixed(2)}? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
