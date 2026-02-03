'use client';

import { useState, useEffect } from 'react';
import { useBudget } from '@/lib/contexts/BudgetContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { CreateMonthBudgetModal } from '@/components/budgets/CreateMonthBudgetModal';
import MonthNavigation from '@/components/navigation/MonthNavigation';

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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{household.name} Dashboard</h1>
          <MonthNavigation />
        </div>

        {/* Alerts */}
        {activeAlerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg ${
                  alert.severity === 'danger'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                }`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {household.currency === 'NGN' ? '₦' : '$'}
                {budgetSummary.totalIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Budgeted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {household.currency === 'NGN' ? '₦' : '$'}
                {budgetSummary.totalBudgeted.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {household.currency === 'NGN' ? '₦' : '$'}
                {budgetSummary.totalSpent.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {((budgetSummary.totalSpent / budgetSummary.totalBudgeted) * 100).toFixed(1)}% of budget
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  budgetSummary.remaining >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {household.currency === 'NGN' ? '₦' : '$'}
                {budgetSummary.remaining.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Budget by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorySpending.map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{cat.categoryName}</span>
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
                    <div className="text-xs text-gray-600 mt-1">
                      {household.currency === 'NGN' ? '₦' : '$'}
                      {cat.spent.toFixed(2)} / {household.currency === 'NGN' ? '₦' : '$'}
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
                        <span className="font-medium text-gray-900">{income.sourceName}</span>
                        <span className="text-sm text-gray-600">{income.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {household.currency === 'NGN' ? '₦' : '$'}
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
