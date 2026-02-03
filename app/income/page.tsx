'use client';

import { useState } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AddIncomeModal } from '@/components/income/AddIncomeModal';
import { EditIncomeModal } from '@/components/income/EditIncomeModal';
import { ConfirmDeleteModal } from '@/components/settings/ConfirmDeleteModal';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import type { Income } from '@/types';

export default function IncomePage() {
  const { incomes, currentMonth, household, deleteIncome } = useBudget();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  const monthIncomes = incomes.filter((i) => i.date.startsWith(currentMonth));
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

  const handleEditIncome = (income: Income) => {
    setSelectedIncome(income);
    setIsEditModalOpen(true);
  };

  const handleDeleteIncome = (income: Income) => {
    setSelectedIncome(income);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Income</h1>
            <p className="text-gray-600 mt-2">Track household income sources</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>+ Add Income</Button>
        </div>

        <MonthNavigation />

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Total Income This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {household?.currency === 'NGN' ? '₦' : '$'}
              {totalIncome.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Income Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {monthIncomes.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No income recorded yet. Add one to get started!</p>
            ) : (
              <div className="space-y-4">
                {monthIncomes
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((income) => (
                    <div
                      key={income.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{income.sourceName}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(income.date).toLocaleDateString()} • {income.userName}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="font-bold text-gray-900 min-w-24 text-right">
                          {household?.currency === 'NGN' ? '₦' : '$'}
                          {income.amount.toFixed(2)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditIncome(income)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteIncome(income)}
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

      <AddIncomeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {selectedIncome && (
        <EditIncomeModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedIncome(null);
          }}
          income={selectedIncome}
        />
      )}
      {selectedIncome && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedIncome(null);
          }}
          onConfirm={() => deleteIncome(selectedIncome.id)}
          title="Delete Income"
          message={`Are you sure you want to delete this ${selectedIncome.sourceName} income of ${household?.currency === 'NGN' ? '₦' : '$'}${selectedIncome.amount.toFixed(2)}? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
