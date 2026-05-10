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
import { FiPlus, FiTrendingUp } from 'react-icons/fi';

export default function IncomePage() {
  const { incomes, currentMonth, household, deleteIncome } = useBudget();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  const monthIncomes = incomes.filter((i) => i.date.startsWith(currentMonth));
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const currency = household?.currency === 'NGN' ? '₦' : '$';

  const handleEditIncome = (income: Income) => {
    setSelectedIncome(income);
    setIsEditModalOpen(true);
  };

  const handleDeleteIncome = (income: Income) => {
    setSelectedIncome(income);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7">
          <div className="mb-6 text-xs font-medium text-slate-400">
            Dashboard <span className="mx-2">›</span> Income
          </div>
          <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">Income</h1>
              <p className="mt-6 text-base font-medium text-slate-950">Track household income sources</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 sm:w-[520px]">
                <MonthNavigation />
              </div>
              <Button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-2">
                <FiPlus aria-hidden="true" />
                Add Income
              </Button>
            </div>
          </div>
        </div>

        <Card className="mb-7 border-0 bg-teal-50">
          <CardHeader className="mb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Income This Month</CardTitle>
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-teal-600 shadow-sm">
              <FiTrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight text-slate-950">
              {currency}
              {totalIncome.toFixed(2)}
            </div>
            <p className="mt-3 text-xs font-semibold text-teal-600">{monthIncomes.length} entries this month</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white p-0">
          <CardHeader className="mb-0 border-b border-slate-100 p-5">
            <CardTitle className="text-sm uppercase tracking-wide">Income Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {monthIncomes.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">No income recorded yet. Add one to get started.</p>
            ) : (
              <div className="space-y-3">
                {monthIncomes
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((income) => (
                    <div
                      key={income.id}
                      className="flex flex-col gap-4 rounded-lg bg-slate-50 px-4 py-3 transition hover:bg-slate-100 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{income.sourceName}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {new Date(income.date).toLocaleDateString()} • {income.userName}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="min-w-24 text-right font-semibold text-slate-950">
                          {currency}
                          {income.amount.toFixed(2)}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditIncome(income)}>
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
          message={`Are you sure you want to delete this ${selectedIncome.sourceName} income of ${currency}${selectedIncome.amount.toFixed(2)}? This action cannot be undone.`}
        />
      )}
    </div>
  );
}
