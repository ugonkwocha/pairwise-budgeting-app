'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { CreateMonthBudgetModal } from '@/components/budgets/CreateMonthBudgetModal';
import MonthNavigation from '@/components/navigation/MonthNavigation';
import { FiActivity, FiArrowDownRight, FiArrowUpRight, FiCreditCard } from 'react-icons/fi';

export default function DashboardPage() {
  const {
    budgetSummary,
    categorySpending,
    incomeBreakdown,
    household,
    activeAlerts,
    currentMonth,
    monthlyCategories,
    categories,
    onboardingCompleted,
    createMonthlyBudgets,
  } = useBudget();

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const hasTemplates = categories.length > 0;
    const hasMonthlyBudgets = monthlyCategories.some((mc) => mc.month === currentMonth);

    if (hasTemplates && !hasMonthlyBudgets && onboardingCompleted) {
      setShowCreateModal(true);
    } else {
      setShowCreateModal(false);
    }
  }, [currentMonth, monthlyCategories, categories, onboardingCompleted]);

  const handleCreateBudget = () => {
    createMonthlyBudgets(currentMonth);
    setShowCreateModal(false);
  };

  if (!household) {
    return <div>Loading...</div>;
  }

  const currencySymbol = household.currency === 'NGN' ? '₦' : '$';
  const spentPercentage = budgetSummary.totalBudgeted > 0
    ? (budgetSummary.totalSpent / budgetSummary.totalBudgeted) * 100
    : 0;

  const metrics = [
    {
      label: 'Total Income',
      value: budgetSummary.totalIncome,
      icon: FiArrowUpRight,
      accent: 'text-emerald-700',
      surface: 'bg-emerald-50',
    },
    {
      label: 'Budgeted',
      value: budgetSummary.totalBudgeted,
      icon: FiActivity,
      accent: 'text-blue-700',
      surface: 'bg-blue-50',
    },
    {
      label: 'Spent',
      value: budgetSummary.totalSpent,
      icon: FiCreditCard,
      accent: 'text-amber-700',
      surface: 'bg-amber-50',
      detail: `${spentPercentage.toFixed(1)}% of budget`,
    },
    {
      label: 'Remaining',
      value: budgetSummary.remaining,
      icon: FiArrowDownRight,
      accent: budgetSummary.remaining >= 0 ? 'text-emerald-700' : 'text-red-700',
      surface: budgetSummary.remaining >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Dashboard</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-950 md:text-4xl">{household.name}</h1>
            </div>
            <p className="max-w-xl text-sm text-slate-600">
              Track income, spending, and budget health for your household.
            </p>
          </div>
          <MonthNavigation />
        </div>

        {activeAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 text-sm font-medium shadow-sm ${
                  alert.severity === 'danger'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="overflow-hidden">
              <CardHeader className="mb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-600">{metric.label}</CardTitle>
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${metric.surface} ${metric.accent}`}>
                  <metric.icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold tracking-tight ${metric.accent} md:text-3xl`}>
                  {currencySymbol}
                  {metric.value.toFixed(2)}
                </div>
                {metric.detail && (
                  <div className="mt-1 text-sm font-medium text-slate-500">{metric.detail}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Budget by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySpending.map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-slate-900">{cat.categoryName}</span>
                      <Badge
                        variant={
                          cat.status === 'healthy'
                            ? 'success'
                            : cat.status === 'warning'
                              ? 'warning'
                              : 'danger'
                        }
                        size="sm"
                      >
                        {cat.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <ProgressBar
                      percentage={cat.percentage}
                      status={cat.status}
                      showLabel={false}
                    />
                    <div className="mt-1 text-xs font-medium text-slate-500">
                      {currencySymbol}
                      {cat.spent.toFixed(2)} / {currencySymbol}
                      {cat.budget.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Income Breakdown */}
          {incomeBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Income Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incomeBreakdown.map((income) => (
                    <div key={income.sourceId}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-900">{income.sourceName}</span>
                        <span className="text-sm font-medium text-slate-500">{income.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-lg font-semibold text-slate-950">
                        {currencySymbol}
                        {income.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateMonthBudgetModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        month={currentMonth}
        onConfirm={handleCreateBudget}
      />
    </div>
  );
}
